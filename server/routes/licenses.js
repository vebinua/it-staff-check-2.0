const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: converts undefined → null (MySQL2 requirement)
const n = (value) => (value === undefined ? null : value);
const j = (value) => JSON.stringify(value || []); // for assignedUsers

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [licenses] = await pool.execute(`
      SELECT
        l.*,
        u.name as added_by_name
      FROM software_licenses l
      LEFT JOIN users u ON l.added_by_id = u.id
      ORDER BY l.created_at DESC
    `);

    const licenseIds = licenses.map(l => l.id);
    let addins = [];

    if (licenseIds.length > 0) {
      const placeholders = licenseIds.map(() => '?').join(',');
      const [addinResults] = await pool.execute(
        `SELECT * FROM software_addins WHERE license_id IN (${placeholders})`,
        licenseIds
      );
      addins = addinResults;
    }

    const formattedLicenses = licenses.map(license => ({
      id: license.id,
      name: license.name,
      vendor: license.vendor,
      version: license.version,
      licenseType: license.license_type,
      totalLicenses: license.total_licenses,
      usedLicenses: license.used_licenses,
      purchaseDate: license.purchase_date,
      expiryDate: license.expiry_date,
      cost: parseFloat(license.cost || 0),
      licenseKey: license.license_key,
      assignedUsers: license.assigned_users ? JSON.parse(license.assigned_users) : [],
      status: license.status,
      notes: license.notes,
      entity: license.entity,
      department: license.department,
      addedBy: license.added_by_name || 'Unknown',
      timestamp: license.created_at,
      addIns: addins
        .filter(a => a.license_id === license.id)
        .map(addin => ({
          id: addin.id,
          name: addin.name,
          cost: parseFloat(addin.cost || 0),
          totalLicenses: addin.total_licenses,
          usedLicenses: addin.used_licenses,
          purchaseDate: addin.purchase_date,
          expiryDate: addin.expiry_date,
          notes: addin.notes
        }))
    }));

    res.json(formattedLicenses);
  } catch (error) {
    console.error('Error fetching software licenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name, vendor, version, licenseType, totalLicenses, usedLicenses = 0,
      purchaseDate, expiryDate, cost, licenseKey, assignedUsers = [], status = 'active',
      notes, entity, department, addIns = []
    } = req.body;

    if (!name || !licenseKey) {
      return res.status(400).json({ error: 'Name and license key are required' });
    }

    const licenseId = `lic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await connection.execute(`
      INSERT INTO software_licenses (
        id, name, vendor, version, license_type, total_licenses, used_licenses,
        purchase_date, expiry_date, cost, license_key, assigned_users, status, notes,
        entity, department, added_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      licenseId,
      name?.trim(),
      n(vendor),
      n(version),
      n(licenseType),
      n(totalLicenses),
      n(usedLicenses),
      n(purchaseDate || null),
      n(expiryDate || null),
      n(cost),
      licenseKey?.trim(),
      j(assignedUsers),
      status,
      n(notes),
      n(entity),
      n(department),
      req.user.id
    ]);

    if (addIns.length > 0) {
      for (let i = 0; i < addIns.length; i++) {
        const a = addIns[i];
        await connection.execute(`
          INSERT INTO software_addins (
            id, license_id, name, cost, total_licenses, used_licenses,
            purchase_date, expiry_date, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `addin-${Date.now()}-${i}`,
          licenseId,
          a.name,
          n(a.cost),
          n(a.totalLicenses),
          n(a.usedLicenses),
          n(a.purchaseDate || null),
          n(a.expiryDate || null),
          n(a.notes)
        ]);
      }
    }

    await connection.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_entry', licenseId, name, `Added software license: ${name}`]
    );

    await connection.commit();
    res.status(201).json({ message: 'Software license created successfully', id: licenseId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating software license:', error);
    res.status(500).json({ error: 'Failed to create license', details: error.message });
  } finally {
    connection.release();
  }
});

// UPDATE
router.put('/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const licenseId = req.params.id;
    const {
      name, vendor, version, licenseType, totalLicenses, usedLicenses,
      purchaseDate, expiryDate, cost, licenseKey, assignedUsers = [], status = 'active',
      notes, entity, department, addIns = []
    } = req.body;

    await connection.execute(`
      UPDATE software_licenses SET
        name = ?, vendor = ?, version = ?, license_type = ?,
        total_licenses = ?, used_licenses = ?, purchase_date = ?, expiry_date = ?,
        cost = ?, license_key = ?, assigned_users = ?, status = ?, notes = ?,
        entity = ?, department = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name?.trim(),
      n(vendor),
      n(version),
      n(licenseType),
      n(totalLicenses),
      n(usedLicenses),
      n(purchaseDate || null),
      n(expiryDate || null),
      n(cost),
      licenseKey?.trim(),
      j(assignedUsers),
      status,
      n(notes),
      n(entity),
      n(department),
      licenseId
    ]);

    await connection.execute('DELETE FROM software_addins WHERE license_id = ?', [licenseId]);

    if (addIns.length > 0) {
      for (let i = 0; i < addIns.length; i++) {
        const a = addIns[i];
        await connection.execute(`
          INSERT INTO software_addins (
            id, license_id, name, cost, total_licenses, used_licenses,
            purchase_date, expiry_date, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `addin-${Date.now()}-${i}`,
          licenseId,
          a.name,
          n(a.cost),
          n(a.totalLicenses),
          n(a.usedLicenses),
          n(a.purchaseDate || null),
          n(a.expiryDate || null),
          n(a.notes)
        ]);
      }
    }

    await connection.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_entry', licenseId, name, `Updated software license: ${name}`]
    );

    await connection.commit();
    res.json({ message: 'Software license updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating software license:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// DELETE (unchanged – already safe)
router.delete('/:id', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const licenseId = req.params.id;

    const [licenses] = await pool.execute('SELECT name FROM software_licenses WHERE id = ?', [licenseId]);
    if (licenses.length === 0) return res.status(404).json({ error: 'License not found' });

    const license = licenses[0];

    await pool.execute('DELETE FROM software_licenses WHERE id = ?', [licenseId]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_entry', licenseId, license.name, `Deleted software license: ${license.name}`]
    );

    res.json({ message: 'Software license deleted successfully' });
  } catch (error) {
    console.error('Error deleting software license:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;