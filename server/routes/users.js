const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin','global-admin']), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, name, role, module_permissions, created_at FROM users ORDER BY created_at DESC'
    );
    
    const formattedUsers = rows.map(user => ({
      ...user,
      modulePermissions: user.module_permissions ? JSON.parse(user.module_permissions) : []
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (admin only)
//router.post('/', authenticateToken, requireRole(['admin','global-admin']), async (req, res) => {
//}
//)
router.post('/', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const { username, name, role, modulePermissions = [], password = 'password' } = req.body;

    if (!username || !name || !role) {
      return res.status(400).json({ error: 'Username, name, and role are required' });
    }

    // Check if username already exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const modulePermissionsJson =
    (role === 'module-admin' || role === 'standard-user')
         ? JSON.stringify(Array.isArray(modulePermissions) ? modulePermissions : [])
         : null;

     // Insert user
    const userId = `user-${Date.now()}`;


    await pool.execute(
      'INSERT INTO users (id, username, password_hash, name, role, module_permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, passwordHash, name, role, modulePermissionsJson]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_user', userId, name, `Added new user: ${name} (${role})`]
    );

    res.status(201).json({ message: 'User created successfully', id: userId });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, name, role, modulePermissions } = req.body;

    if (!username || !name || !role) {
      return res.status(400).json({ error: 'Username, name, and role are required' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?', 
      [username, userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // FIXED: Support both module-admin AND standard-user
    const modulePermissionsJson = (role === 'module-admin' || role === 'standard-user')
      ? JSON.stringify(Array.isArray(modulePermissions) ? modulePermissions : [])
      : null;

    await pool.execute(
      `UPDATE users 
       SET username = ?, name = ?, role = ?, module_permissions = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [username, name, role, modulePermissionsJson, userId]
    );

    const [updatedUser] = await pool.execute(
      'SELECT module_permissions FROM users WHERE id = ?', [userId]
    );

    console.log('Saved module_permissions:', updatedUser[0].module_permissions); // Should now show array for standard-user too

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_user', userId, name, `Updated user: ${name} (${role})`]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole(['global-admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting own account
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get user name for logging
    const [users] = await pool.execute('SELECT name, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Delete user
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_user', userId, user.name, `Deleted user: ${user.name} (${user.role})`]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;