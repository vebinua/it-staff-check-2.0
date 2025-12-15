const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper: converts undefined → null (MySQL2 requirement)
const n = (value) => (value === undefined ? null : value);

router.get('/links', authenticateToken, async (req, res) => {
  try {
    const [links] = await pool.execute(`
      SELECT
        fl.*,
        u.name as created_by_name,
        COUNT(fr.id) as response_count,
        AVG(fr.rating) as average_rating
      FROM feedback_links fl
      LEFT JOIN users u ON fl.created_by_id = u.id
      LEFT JOIN feedback_responses fr ON fl.id = fr.feedback_link_id
      GROUP BY fl.id
      ORDER BY fl.created_at DESC
    `);

    const formattedLinks = links.map(link => ({
      id: link.id,
      staffName: link.staff_name,
      customerName: link.customer_name,
      client: link.client,
      taskName: link.task_name,
      generatedLink: link.generated_link,
      isUsed: Boolean(link.is_used),
      usedAt: link.used_at,
      createdBy: link.created_by_name || 'Unknown',
      createdAt: link.created_at,
      responses: parseInt(link.response_count) || 0,
      averageRating: parseFloat(link.average_rating) || 0
    }));

    res.json(formattedLinks);
  } catch (error) {
    console.error('Error fetching feedback links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/links/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;

    const [links] = await pool.execute(
      'SELECT * FROM feedback_links WHERE link_id = ?',
      [linkId]
    );

    if (links.length === 0) {
      return res.status(404).json({ error: 'Feedback link not found' });
    }

    const link = links[0];

    res.json({
      id: link.id,
      staffName: link.staff_name,
      customerName: link.customer_name,
      client: link.client,
      taskName: link.task_name,
      isUsed: Boolean(link.is_used)
    });
  } catch (error) {
    console.error('Error fetching feedback link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/links', authenticateToken, async (req, res) => {
  try {
    const { staffName, customerName, client, taskName } = req.body;

    if (!customerName?.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const linkId = `fb-${Date.now()}`;
    const uniqueLinkId = `${linkId}-${Math.random().toString(36).substring(7)}`;
    const generatedLink = `${process.env.APP_URL || 'https://techassetmanagement.abledonline.com'}?id=${uniqueLinkId}`;

    await pool.execute(`
      INSERT INTO feedback_links (
        id, link_id, staff_name, customer_name, client, task_name,
        generated_link, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      linkId,
      uniqueLinkId,
      n(staffName),
      customerName.trim(),
      n(client),
      n(taskName),
      generatedLink,
      req.user.id
    ]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_entry', linkId, customerName, `Created feedback link for ${customerName}`]
    );

    res.status(201).json({
      message: 'Feedback link created successfully',
      id: linkId,
      link: generatedLink
    });
  } catch (error) {
    console.error('Error creating feedback link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FIXED: This route was causing the undefined error
router.post('/submit/:linkId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { linkId } = req.params;
    const { rating, comments, clientName, clientEmail, clientCompany } = req.body;

    const [links] = await connection.execute(
      'SELECT id FROM feedback_links WHERE link_id = ? FOR UPDATE',
      [linkId]
    );

    if (links.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Feedback link not found or already used' });
    }

    const feedbackLinkId = links[0].id;
    const responseId = `response-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // THIS IS THE KEY FIX: Use n() on every optional field
    await connection.execute(`
      INSERT INTO feedback_responses (
        id, feedback_link_id, rating, comments, client_name, client_email, client_company, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      responseId,
      feedbackLinkId,
      n(rating),           // ← was undefined
      n(comments),         // ← was undefined
      n(clientName),       // ← was undefined
      n(clientEmail),      // ← was undefined
      n(clientCompany)     // ← was undefined
    ]);

    await connection.execute(
      'UPDATE feedback_links SET is_used = TRUE, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [feedbackLinkId]
    );

    await connection.commit();

    res.status(201).json({ message: 'Thank you! Your feedback has been submitted.' });

  } catch (error) {
    await connection.rollback();
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  } finally {
    connection.release();
  }
});

router.get('/responses/:linkId', authenticateToken, async (req, res) => {
  try {
    const { linkId } = req.params;

    const [responses] = await pool.execute(`
      SELECT fr.*
      FROM feedback_responses fr
      INNER JOIN feedback_links fl ON fr.feedback_link_id = fl.id
      WHERE fl.id = ?
      ORDER BY fr.submitted_at DESC
    `, [linkId]);

    const formattedResponses = responses.map(response => ({
      id: response.id,
      linkId: response.feedback_link_id,
      rating: response.rating,
      comments: response.comments,
      clientInfo: {
        name: response.client_name,
        email: response.client_email,
        company: response.client_company
      },
      submittedAt: response.submitted_at
    }));

    res.json(formattedResponses);
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/links/:id', authenticateToken, async (req, res) => {
  try {
    const linkId = req.params.id;

    const [links] = await pool.execute('SELECT customer_name FROM feedback_links WHERE id = ?', [linkId]);

    if (links.length === 0) {
      return res.status(404).json({ error: 'Feedback link not found' });
    }

    const link = links[0];

    await pool.execute('DELETE FROM feedback_links WHERE id = ?', [linkId]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_entry', linkId, link.customer_name, `Deleted feedback link for ${link.customer_name}`]
    );

    res.json({ message: 'Feedback link deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;