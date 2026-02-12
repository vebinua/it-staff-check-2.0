const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [staff] = await db.query(
      `SELECT id, name, department, position, email, is_active, created_at, updated_at
       FROM staff
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [staff] = await db.query(
      'SELECT id, name, department, position, email, is_active, created_at, updated_at FROM staff WHERE id = ?',
      [req.params.id]
    );

    if (staff.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(staff[0]);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, department, position, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [result] = await db.query(
      `INSERT INTO staff (name, department, position, email, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [name, department || null, position || null, email || null]
    );

    const [newStaff] = await db.query(
      'SELECT id, name, department, position, email, is_active, created_at, updated_at FROM staff WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newStaff[0]);
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, department, position, email, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await db.query(
      `UPDATE staff
       SET name = ?, department = ?, position = ?, email = ?, is_active = ?
       WHERE id = ?`,
      [name, department || null, position || null, email || null, is_active !== false, req.params.id]
    );

    const [updatedStaff] = await db.query(
      'SELECT id, name, department, position, email, is_active, created_at, updated_at FROM staff WHERE id = ?',
      [req.params.id]
    );

    if (updatedStaff.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(updatedStaff[0]);
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE staff SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Staff member deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating staff member:', error);
    res.status(500).json({ error: 'Failed to deactivate staff member' });
  }
});

module.exports = router;
