const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [entries] = await pool.execute(`
      SELECT
        e.*,
        u.name as added_by_name
      FROM internal_log_entries e
      LEFT JOIN users u ON e.added_by_id = u.id
      ORDER BY e.created_at DESC
    `);

    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      idCode: entry.id_code,
      clientName: entry.client_name,
      subjectIssue: entry.subject_issue,
      category: entry.category,
      dateStarted: entry.date_started,
      timeStarted: entry.time_started,
      dateFinished: entry.date_finished,
      timeFinished: entry.time_finished,
      technicianName: entry.technician_name,
      resolutionDetails: entry.resolution_details,
      remarks: entry.remarks,
      status: entry.status,
      timeConsumedMinutes: entry.time_consumed_minutes,
      totalTimeChargeMinutes: entry.total_time_charge_minutes,
      addedBy: entry.added_by_name || 'Unknown',
      timestamp: entry.created_at
    }));

    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching internal log entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      idCode, clientName, subjectIssue, category,
      dateStarted, timeStarted, dateFinished, timeFinished,
      technicianName, resolutionDetails, remarks, status,
      timeConsumedMinutes, totalTimeChargeMinutes
    } = req.body;

    const entryId = `int-${Date.now()}`;

    await pool.execute(`
      INSERT INTO internal_log_entries (
        id, id_code, client_name, subject_issue, category,
        date_started, time_started, date_finished, time_finished,
        technician_name, resolution_details, remarks, status,
        time_consumed_minutes, total_time_charge_minutes, added_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entryId, idCode, clientName, subjectIssue, category,
      dateStarted, timeStarted, dateFinished, timeFinished,
      technicianName, resolutionDetails, remarks, status,
      timeConsumedMinutes, totalTimeChargeMinutes, req.user.id
    ]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_entry', entryId, clientName, `Added internal log entry: ${idCode}`]
    );

    res.status(201).json({ message: 'Internal log entry created successfully', id: entryId });
  } catch (error) {
    console.error('Error creating internal log entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const entryId = req.params.id;
    const {
      idCode, clientName, subjectIssue, category,
      dateStarted, timeStarted, dateFinished, timeFinished,
      technicianName, resolutionDetails, remarks, status,
      timeConsumedMinutes, totalTimeChargeMinutes
    } = req.body;

    await pool.execute(`
      UPDATE internal_log_entries SET
        id_code = ?, client_name = ?, subject_issue = ?, category = ?,
        date_started = ?, time_started = ?, date_finished = ?, time_finished = ?,
        technician_name = ?, resolution_details = ?, remarks = ?, status = ?,
        time_consumed_minutes = ?, total_time_charge_minutes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      idCode, clientName, subjectIssue, category,
      dateStarted, timeStarted, dateFinished, timeFinished,
      technicianName, resolutionDetails, remarks, status,
      timeConsumedMinutes, totalTimeChargeMinutes, entryId
    ]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_entry', entryId, clientName, `Updated internal log entry: ${idCode}`]
    );

    res.json({ message: 'Internal log entry updated successfully' });
  } catch (error) {
    console.error('Error updating internal log entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const entryId = req.params.id;

    const [entries] = await pool.execute('SELECT id_code, client_name FROM internal_log_entries WHERE id = ?', [entryId]);

    if (entries.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = entries[0];

    await pool.execute('DELETE FROM internal_log_entries WHERE id = ?', [entryId]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_entry', entryId, entry.client_name, `Deleted internal log entry: ${entry.id_code}`]
    );

    res.json({ message: 'Internal log entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting internal log entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
