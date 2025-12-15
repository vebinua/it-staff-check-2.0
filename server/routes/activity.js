const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get activity logs (admin only)
router.get('/', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        al.*,
        u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 1000
    `);

    const formattedLogs = rows.map(log => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user_name || 'Unknown',
      action: log.action,
      targetId: log.target_id,
      targetName: log.target_name,
      details: log.details,
      timestamp: log.created_at
    }));

    res.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;