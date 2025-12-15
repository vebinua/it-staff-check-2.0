const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [blocks] = await pool.execute(`
      SELECT
        cb.*,
        u.name as added_by_name
      FROM credit_blocks cb
      LEFT JOIN users u ON cb.added_by_id = u.id
      ORDER BY cb.block_number DESC
    `);

    const formattedBlocks = blocks.map(block => ({
      id: block.id,
      blockNumber: block.block_number,
      purchaseDate: block.purchase_date,
      totalCredits: parseFloat(block.total_credits),
      isActive: Boolean(block.is_active),
      addedBy: block.added_by_name || 'Unknown',
      timestamp: block.created_at
    }));

    res.json(formattedBlocks);
  } catch (error) {
    console.error('Error fetching credit blocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/active', authenticateToken, async (req, res) => {
  try {
    const [blocks] = await pool.execute(`
      SELECT * FROM credit_blocks
      WHERE is_active = TRUE
      ORDER BY block_number DESC
      LIMIT 1
    `);

    if (blocks.length === 0) {
      return res.json(null);
    }

    const block = blocks[0];
    res.json({
      id: block.id,
      blockNumber: block.block_number,
      purchaseDate: block.purchase_date,
      totalCredits: parseFloat(block.total_credits),
      isActive: Boolean(block.is_active),
      timestamp: block.created_at
    });
  } catch (error) {
    console.error('Error fetching active credit block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const { blockNumber, purchaseDate, totalCredits, isActive } = req.body;

    const blockId = `credit-${Date.now()}`;

    await pool.execute(`
      INSERT INTO credit_blocks (
        id, block_number, purchase_date, total_credits, is_active, added_by_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [blockId, blockNumber, purchaseDate, totalCredits, isActive, req.user.id]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_entry', blockId, `Block ${blockNumber}`, `Added credit block #${blockNumber} with ${totalCredits} credits`]
    );

    res.status(201).json({ message: 'Credit block created successfully', id: blockId });
  } catch (error) {
    console.error('Error creating credit block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const blockId = req.params.id;
    const { blockNumber, purchaseDate, totalCredits, isActive } = req.body;

    await pool.execute(`
      UPDATE credit_blocks SET
        block_number = ?, purchase_date = ?, total_credits = ?, is_active = ?
      WHERE id = ?
    `, [blockNumber, purchaseDate, totalCredits, isActive, blockId]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_entry', blockId, `Block ${blockNumber}`, `Updated credit block #${blockNumber}`]
    );

    res.json({ message: 'Credit block updated successfully' });
  } catch (error) {
    console.error('Error updating credit block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const blockId = req.params.id;

    const [blocks] = await pool.execute('SELECT block_number FROM credit_blocks WHERE id = ?', [blockId]);

    if (blocks.length === 0) {
      return res.status(404).json({ error: 'Credit block not found' });
    }

    const block = blocks[0];

    await pool.execute('DELETE FROM credit_blocks WHERE id = ?', [blockId]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_entry', blockId, `Block ${block.block_number}`, `Deleted credit block #${block.block_number}`]
    );

    res.json({ message: 'Credit block deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
