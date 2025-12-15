const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [tickets] = await pool.execute(`
      SELECT
        t.*,
        u1.name as created_by_name,
        u2.name as assigned_to_name
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_id = u2.id
      ORDER BY t.created_at DESC
    `);

    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assigned_to_id,
      assignedToName: ticket.assigned_to_name,
      createdBy: ticket.created_by_id,
      createdByName: ticket.created_by_name || 'Unknown',
      dueDate: ticket.due_date,
      resolvedAt: ticket.resolved_at,
      parentTicketId: ticket.parent_ticket_id,
      labels: ticket.labels ? JSON.parse(ticket.labels) : [],
      slaBreached: Boolean(ticket.sla_breached),
      responseTime: ticket.response_time_minutes,
      resolutionTime: ticket.resolution_time_minutes,
      isBeingViewed: Boolean(ticket.is_being_viewed),
      viewedBy: ticket.viewed_by ? JSON.parse(ticket.viewed_by) : [],
      lastViewedAt: ticket.last_viewed_at,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      childTicketIds: []
    }));

    const ticketIds = tickets.map(t => t.id);
    if (ticketIds.length > 0) {
      const placeholders = ticketIds.map(() => '?').join(',');
      const [childTickets] = await pool.execute(
        `SELECT id, parent_ticket_id FROM tickets WHERE parent_ticket_id IN (${placeholders})`,
        ticketIds
      );

      childTickets.forEach(child => {
        const parent = formattedTickets.find(t => t.id === child.parent_ticket_id);
        if (parent) {
          parent.childTicketIds.push(child.id);
        }
      });
    }

    res.json(formattedTickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;

    const [tickets] = await pool.execute(`
      SELECT
        t.*,
        u1.name as created_by_name,
        u2.name as assigned_to_name
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_id = u2.id
      WHERE t.id = ?
    `, [ticketId]);

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    res.json({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assigned_to_id,
      assignedToName: ticket.assigned_to_name,
      createdBy: ticket.created_by_id,
      createdByName: ticket.created_by_name || 'Unknown',
      dueDate: ticket.due_date,
      resolvedAt: ticket.resolved_at,
      parentTicketId: ticket.parent_ticket_id,
      labels: ticket.labels ? JSON.parse(ticket.labels) : [],
      slaBreached: Boolean(ticket.sla_breached),
      responseTime: ticket.response_time_minutes,
      resolutionTime: ticket.resolution_time_minutes,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      title,
      description,
      priority = 'medium',
      category,
      assignedTo = null,
      dueDate = null,
      labels = []
    } = req.body;

    if (!title?.trim() || !description?.trim() || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    // === ATOMIC TICKET NUMBER GENERATION (NO MORE DUPLICATES) ===
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Increment today's counter atomically
    await connection.execute(`
      INSERT INTO ticket_sequence (seq_date, last_number) 
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE last_number = last_number + 1
    `, [today]);

    // Get the new sequence number
    const [seqRows] = await connection.execute(
      `SELECT last_number FROM ticket_sequence WHERE seq_date = ?`,
      [today]
    );

    const seq = seqRows[0].last_number;
    const ticketNumber = `TICKET-${today.replace(/-/g, '')}-${String(seq).padStart(3, '0')}`;
    // Example: TICKET-20251118-001, TICKET-20251118-002, etc.

    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // === INSERT TICKET SAFELY ===
    await connection.execute(
      `INSERT INTO tickets (
        id, ticket_number, title, description, status, priority, category,
        assigned_to_id, due_date, labels, created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        ticketId,
        ticketNumber,
        title.trim(),
        description.trim(),
        'open',
        priority,
        category,
        assignedTo,
        dueDate,
        JSON.stringify(labels),
        req.user.id
      ]
    );

    // === LOG ACTIVITY ===
    await connection.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_entry', ticketId, ticketNumber, `Created ticket: ${ticketNumber}`]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Ticket created successfully!',
      id: ticketId,
      ticketNumber
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create ticket error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(500).json({ error: 'Failed to generate unique ticket number. Please try again.' });
    }

    res.status(500).json({ error: 'Failed to create ticket', details: error.message });
  } finally {
    connection.release();
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const {
      title, description, status, priority, category,
      assignedTo, dueDate, resolvedAt, labels, slaBreached,
      responseTime, resolutionTime
    } = req.body;

    await pool.execute(`
      UPDATE tickets SET
        title = ?, description = ?, status = ?, priority = ?, category = ?,
        assigned_to_id = ?, due_date = ?, resolved_at = ?, labels = ?,
        sla_breached = ?, response_time_minutes = ?, resolution_time_minutes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title, description, status, priority, category,
      assignedTo, dueDate, resolvedAt, JSON.stringify(labels || []),
      slaBreached, responseTime, resolutionTime, ticketId
    ]);

    const [tickets] = await pool.execute('SELECT ticket_number FROM tickets WHERE id = ?', [ticketId]);
    const ticketNumber = tickets[0]?.ticket_number;

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_entry', ticketId, ticketNumber, `Updated ticket: ${ticketNumber}`]
    );

    res.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const ticketId = req.params.id;

    const [tickets] = await pool.execute('SELECT ticket_number FROM tickets WHERE id = ?', [ticketId]);

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    await pool.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_entry', ticketId, ticket.ticket_number, `Deleted ticket: ${ticket.ticket_number}`]
    );

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;

    const [comments] = await pool.execute(`
      SELECT
        c.*,
        u.name as created_by_name
      FROM ticket_comments c
      LEFT JOIN users u ON c.created_by_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `, [ticketId]);

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      ticketId: comment.ticket_id,
      content: comment.content,
      isPrivate: Boolean(comment.is_private),
      createdBy: comment.created_by_id,
      createdByName: comment.created_by_name || 'Unknown',
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    }));

    res.json(formattedComments);
  } catch (error) {
    console.error('Error fetching ticket comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { content, isPrivate } = req.body;

    const commentId = `comment-${Date.now()}`;

    await pool.execute(`
      INSERT INTO ticket_comments (
        id, ticket_id, content, is_private, created_by_id
      ) VALUES (?, ?, ?, ?, ?)
    `, [commentId, ticketId, content, isPrivate || false, req.user.id]);

    res.status(201).json({ message: 'Comment added successfully', id: commentId });
  } catch (error) {
    console.error('Error adding ticket comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
