const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all IT check entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [entries] = await pool.execute(`
      SELECT 
        e.*,
        u.name as added_by_name,
        GROUP_CONCAT(DISTINCT CONCAT(st.id, ':', st.url, ':', st.download_speed, ':', st.upload_speed, ':', st.ping, ':', st.test_order) SEPARATOR '|') as speed_tests,
        GROUP_CONCAT(DISTINCT CONCAT(ia.id, ':', ia.name, ':', ia.version, ':', COALESCE(ia.notes, '')) SEPARATOR '|') as installed_apps
      FROM it_check_entries e
      LEFT JOIN users u ON e.added_by_id = u.id
      LEFT JOIN speed_tests st ON e.id = st.it_check_entry_id
      LEFT JOIN installed_apps ia ON e.id = ia.it_check_entry_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    // Parse the concatenated data
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      name: entry.name,
      department: entry.department,
      batchNumber: entry.batch_number,
      computerType: entry.computer_type,
      itCheckCompleted: entry.it_check_completed,
      ipAddress: entry.ip_address,
      isp: entry.isp,
      connectionType: entry.connection_type,
      operatingSystem: entry.operating_system,
      processor: {
        brand: entry.processor_brand,
        series: entry.processor_series,
        generation: entry.processor_generation,
        macProcessor: entry.processor_mac
      },
      memory: entry.memory,
      graphics: entry.graphics,
      storage: entry.storage,
      pcModel: entry.pc_model,
      status: entry.status,
      addedBy: entry.added_by_name || 'Unknown',
      timestamp: entry.created_at,
      speedTests: entry.speed_tests ? entry.speed_tests.split('|').map(test => {
        const [id, url, http, download, upload, ping, order] = test.split(':');
        const fullUrl = `${url}:${http}`;

        return {
          url: fullUrl,
          downloadSpeed: parseFloat(download),
          uploadSpeed: parseFloat(upload),
          ping: parseFloat(ping)
        };
      }) : [],
      installedApps: entry.installed_apps ? entry.installed_apps.split('|').map(app => {
        const [id, name, version, notes] = app.split(':');
        return { name, version, notes: notes || '' };
      }) : []
    }));

    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching IT check entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new IT check entry
router.post('/', authenticateToken, requireRole(['admin', 'global-admin', 'editor']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      name, department, batchNumber, computerType, itCheckCompleted,
      ipAddress, isp, connectionType, operatingSystem,
      processor, memory, graphics, storage, pcModel, status,
      speedTests, installedApps
    } = req.body;

    // Insert main entry
    const entryId = `entry-${Date.now()}`;
    await connection.execute(`
      INSERT INTO it_check_entries (
        id, name, department, batch_number, computer_type, it_check_completed,
        ip_address, isp, connection_type, operating_system,
        processor_brand, processor_series, processor_generation, processor_mac,
        memory, graphics, storage, pc_model, status, added_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entryId, name, department, batchNumber, computerType, itCheckCompleted,
      ipAddress, isp, connectionType, operatingSystem,
      processor.brand, processor.series, processor.generation, processor.macProcessor,
      memory, graphics, storage, pcModel, status, req.user.id
    ]);

    // Insert speed tests
    for (let i = 0; i < speedTests.length; i++) {
      const test = speedTests[i];
      await connection.execute(`
        INSERT INTO speed_tests (id, it_check_entry_id, url, download_speed, upload_speed, ping, test_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [`speed-${Date.now()}-${i}`, entryId, test.url, test.downloadSpeed, test.uploadSpeed, test.ping, i + 1]);
    }

    // Insert installed apps
    for (let i = 0; i < installedApps.length; i++) {
      const app = installedApps[i];
      await connection.execute(`
        INSERT INTO installed_apps (id, it_check_entry_id, name, version, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [`app-${Date.now()}-${i}`, entryId, app.name, app.version, app.notes]);
    }

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_entry', entryId, name, `Added IT check entry for ${name} (${department})`]
    );

    await connection.commit();
    res.status(201).json({ message: 'IT check entry created successfully', id: entryId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating IT check entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update IT check entry
router.put('/:id', authenticateToken, requireRole(['admin', 'global-admin', 'editor']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const entryId = req.params.id;
    const {
      name, department, batchNumber, computerType, itCheckCompleted,
      ipAddress, isp, connectionType, operatingSystem,
      processor, memory, graphics, storage, pcModel, status,
      speedTests, installedApps
    } = req.body;

    // Update main entry
    await connection.execute(`
      UPDATE it_check_entries SET
        name = ?, department = ?, batch_number = ?, computer_type = ?, it_check_completed = ?,
        ip_address = ?, isp = ?, connection_type = ?, operating_system = ?,
        processor_brand = ?, processor_series = ?, processor_generation = ?, processor_mac = ?,
        memory = ?, graphics = ?, storage = ?, pc_model = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, department, batchNumber, computerType, itCheckCompleted,
      ipAddress, isp, connectionType, operatingSystem,
      processor.brand, processor.series, processor.generation, processor.macProcessor,
      memory, graphics, storage, pcModel, status, entryId
    ]);

    // Delete existing speed tests and apps
    await connection.execute('DELETE FROM speed_tests WHERE it_check_entry_id = ?', [entryId]);
    await connection.execute('DELETE FROM installed_apps WHERE it_check_entry_id = ?', [entryId]);

    // Insert new speed tests
    for (let i = 0; i < speedTests.length; i++) {
      const test = speedTests[i];
      await connection.execute(`
        INSERT INTO speed_tests (id, it_check_entry_id, url, download_speed, upload_speed, ping, test_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [`speed-${Date.now()}-${i}`, entryId, test.url, test.downloadSpeed, test.uploadSpeed, test.ping, i + 1]);
    }

    // Insert new installed apps
    for (let i = 0; i < installedApps.length; i++) {
      const app = installedApps[i];
      await connection.execute(`
        INSERT INTO installed_apps (id, it_check_entry_id, name, version, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [`app-${Date.now()}-${i}`, entryId, app.name, app.version, app.notes]);
    }

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_entry', entryId, name, `Updated IT check entry for ${name} (${department})`]
    );

    await connection.commit();
    res.json({ message: 'IT check entry updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating IT check entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Delete IT check entry
router.delete('/:id', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const entryId = req.params.id;
    
    // Get entry name for logging
    const [entries] = await pool.execute('SELECT name, department FROM it_check_entries WHERE id = ?', [entryId]);
    
    if (entries.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = entries[0];

    // Delete entry (cascade will handle related records)
    await pool.execute('DELETE FROM it_check_entries WHERE id = ?', [entryId]);

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_entry', entryId, entry.name, `Deleted IT check entry for ${entry.name} (${entry.department})`]
    );

    res.json({ message: 'IT check entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting IT check entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;