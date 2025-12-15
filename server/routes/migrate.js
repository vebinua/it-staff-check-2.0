const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Migrate local data to database (global-admin only)
router.post('/', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { entries, activityLogs } = req.body;

    let migratedEntries = 0;
    let migratedLogs = 0;

    // Migrate IT check entries
    if (entries && Array.isArray(entries)) {
      for (const entry of entries) {
        try {
          // Check if entry already exists
          const [existing] = await connection.execute(
            'SELECT id FROM it_check_entries WHERE id = ?',
            [entry.id]
          );

          if (existing.length === 0) {
            // Insert main entry
            await connection.execute(`
              INSERT INTO it_check_entries (
                id, name, department, batch_number, computer_type, it_check_completed,
                ip_address, isp, connection_type, operating_system,
                processor_brand, processor_series, processor_generation, processor_mac,
                memory, graphics, storage, pc_model, status, added_by_id, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              entry.id, entry.name, entry.department, entry.batchNumber, entry.computerType, entry.itCheckCompleted,
              entry.ipAddress, entry.isp, entry.connectionType, entry.operatingSystem,
              entry.processor.brand, entry.processor.series, entry.processor.generation, entry.processor.macProcessor,
              entry.memory, entry.graphics, entry.storage, entry.pcModel, entry.status, req.user.id, entry.timestamp
            ]);

            // Insert speed tests
            if (entry.speedTests && Array.isArray(entry.speedTests)) {
              for (let i = 0; i < entry.speedTests.length; i++) {
                const test = entry.speedTests[i];
                await connection.execute(`
                  INSERT INTO speed_tests (id, it_check_entry_id, url, download_speed, upload_speed, ping, test_order)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [`speed-${entry.id}-${i}`, entry.id, test.url, test.downloadSpeed, test.uploadSpeed, test.ping, i + 1]);
              }
            }

            // Insert installed apps
            if (entry.installedApps && Array.isArray(entry.installedApps)) {
              for (let i = 0; i < entry.installedApps.length; i++) {
                const app = entry.installedApps[i];
                await connection.execute(`
                  INSERT INTO installed_apps (id, it_check_entry_id, name, version, notes)
                  VALUES (?, ?, ?, ?, ?)
                `, [`app-${entry.id}-${i}`, entry.id, app.name, app.version, app.notes || '']);
              }
            }

            migratedEntries++;
          }
        } catch (error) {
          console.error(`Error migrating entry ${entry.id}:`, error);
        }
      }
    }

    // Migrate activity logs
    if (activityLogs && Array.isArray(activityLogs)) {
      for (const log of activityLogs) {
        try {
          // Check if log already exists
          const [existing] = await connection.execute(
            'SELECT id FROM activity_logs WHERE id = ?',
            [log.id]
          );

          if (existing.length === 0) {
            await connection.execute(
              'INSERT INTO activity_logs (id, user_id, action, target_id, target_name, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [log.id, log.userId, log.action, log.targetId, log.targetName, log.details, log.timestamp]
            );
            migratedLogs++;
          }
        } catch (error) {
          console.error(`Error migrating activity log ${log.id}:`, error);
        }
      }
    }

    await connection.commit();
    
    res.json({ 
      message: 'Data migration completed successfully',
      migratedEntries,
      migratedLogs
    });

  } catch (error) {
    await connection.rollback();
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed: ' + error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;