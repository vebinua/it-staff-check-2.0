const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM password_categories');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching password categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [entries] = await pool.execute(`
      SELECT
        p.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        u.name as created_by_name
      FROM password_entries p
      LEFT JOIN password_categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.created_by_id = u.id
      ORDER BY p.created_at DESC
    `);

    const entryIds = entries.map(e => e.id);
    let customFields = [];

    if (entryIds.length > 0) {
      const placeholders = entryIds.map(() => '?').join(',');
      const [fieldResults] = await pool.execute(
        `SELECT * FROM password_custom_fields WHERE password_entry_id IN (${placeholders})`,
        entryIds
      );
      customFields = fieldResults;
    }

    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      website: entry.website,
      username: entry.username,
      email: entry.email,
      password: entry.password_encrypted,
      notes: entry.notes,
      category: entry.category_id ? {
        id: entry.category_id,
        name: entry.category_name,
        icon: entry.category_icon,
        color: entry.category_color
      } : null,
      isFavorite: Boolean(entry.is_favorite),
      isCompromised: Boolean(entry.is_compromised),
      lastUsed: entry.last_used,
      tags: entry.tags ? JSON.parse(entry.tags) : [],
      createdBy: entry.created_by_name || 'Unknown',
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      customFields: customFields
        .filter(f => f.password_entry_id === entry.id)
        .map(field => ({
          id: field.id,
          label: field.label,
          value: field.value_encrypted,
          type: field.field_type,
          isHidden: Boolean(field.is_hidden)
        }))
    }));

    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching password entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      title,
      website,
      username,
      email,
      password,
      notes,
      categoryId,        // can be undefined → we fix below
      isFavorite = false,
      isCompromised = false,
      tags = [],
      customFields = []
    } = req.body;

    // REQUIRED fields
    if (!title || !password) {
      return res.status(400).json({ error: 'Title and password are required' });
    }

    const entryId = `pwd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // CRITICAL: Convert undefined → null for SQL safety
    const safeCategoryId = categoryId || null;
    const safeIsFavorite = isFavorite ? 1 : 0;
    const safeIsCompromised = isCompromised ? 1 : 0;
    const safeTags = JSON.stringify(Array.isArray(tags) ? tags : []);

    await connection.execute(`
      INSERT INTO password_entries (
        id, title, website, username, email, password_encrypted, notes,
        category_id, is_favorite, is_compromised, tags, created_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      entryId,
      title.trim(),
      website?.trim() || null,
      username?.trim() || null,
      email?.trim() || null,
      password,
      notes?.trim() || null,
      safeCategoryId,        // ← null instead of undefined
      safeIsFavorite,
      safeIsCompromised,
      safeTags,
      req.user.id
    ]);

    // Handle custom fields safely
    if (Array.isArray(customFields) && customFields.length > 0) {
      for (let i = 0; i < customFields.length; i++) {
        const field = customFields[i];
        const fieldId = `field-${Date.now()}-${i}`;

        await connection.execute(`
          INSERT INTO password_custom_fields (
            id, password_entry_id, label, value_encrypted, field_type, is_hidden
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          fieldId,
          entryId,
          field.label || 'Untitled Field',
          field.value || '',
          field.type || 'text',
          field.isHidden ? 1 : 0
        ]);
      }
    }

    await connection.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_entry', entryId, title, `Added password entry: ${title}`]
    );

    await connection.commit();
    res.status(201).json({ 
      message: 'Password entry created successfully', 
      id: entryId 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating password entry:', error);
    res.status(500).json({ 
      error: 'Failed to create password entry',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const entryId = req.params.id;
    const {
      title, website, username, email, password, notes,
      categoryId, isFavorite, isCompromised, tags, customFields
    } = req.body;

    await connection.execute(`
        UPDATE password_entries SET
          title = ?, website = ?, username = ?, email = ?, password_encrypted = ?,
          notes = ?, category_id = ?, is_favorite = ?, is_compromised = ?,
          tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        title?.trim() || '',
        website?.trim() || null,
        username?.trim() || null,
        email?.trim() || null,
        password,
        notes?.trim() || null,
        categoryId || null,                    // ← safe
        isFavorite ? 1 : 0,
        isCompromised ? 1 : 0,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        entryId
      ]);

    await connection.execute('DELETE FROM password_custom_fields WHERE password_entry_id = ?', [entryId]);

    if (customFields && customFields.length > 0) {
      for (let i = 0; i < customFields.length; i++) {
        const field = customFields[i];
        await connection.execute(`
          INSERT INTO password_custom_fields (
            id, password_entry_id, label, value_encrypted, field_type, is_hidden
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          `field-${Date.now()}-${i}`, entryId, field.label, field.value,
          field.type, field.isHidden
        ]);
      }
    }

    await connection.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_entry', entryId, title, `Updated password entry: ${title}`]
    );

    await connection.commit();
    res.json({ message: 'Password entry updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating password entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const entryId = req.params.id;

    const [entries] = await pool.execute('SELECT title FROM password_entries WHERE id = ?', [entryId]);

    if (entries.length === 0) {
      return res.status(404).json({ error: 'Password entry not found' });
    }

    const entry = entries[0];

    await pool.execute('DELETE FROM password_entries WHERE id = ?', [entryId]);

    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, target_id, target_name, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_entry', entryId, entry.title, `Deleted password entry: ${entry.title}`]
    );

    res.json({ message: 'Password entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting password entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notes', authenticateToken, async (req, res) => {
  try {
    const [notes] = await pool.execute(`
      SELECT
        n.*,
        u.name as created_by_name
      FROM secure_notes n
      LEFT JOIN users u ON n.created_by_id = u.id
      ORDER BY n.created_at DESC
    `);

    const formattedNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content_encrypted,
      category: note.category,
      isFavorite: Boolean(note.is_favorite),
      tags: note.tags ? JSON.parse(note.tags) : [],
      createdBy: note.created_by_name || 'Unknown',
      createdAt: note.created_at,
      updatedAt: note.updated_at
    }));

    res.json(formattedNotes);
  } catch (error) {
    console.error('Error fetching secure notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/notes', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, isFavorite, tags } = req.body;

    const noteId = `note-${Date.now()}`;

    await pool.execute(`
      INSERT INTO secure_notes (
        id, title, content_encrypted, category, is_favorite, tags, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [noteId, title, content, category, isFavorite, JSON.stringify(tags || []), req.user.id]);

    res.status(201).json({ message: 'Secure note created successfully', id: noteId });
  } catch (error) {
    console.error('Error creating secure note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content, category, isFavorite, tags } = req.body;

    await pool.execute(`
      UPDATE secure_notes SET
        title = ?, content_encrypted = ?, category = ?, is_favorite = ?,
        tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, content, category, isFavorite, JSON.stringify(tags || []), noteId]);

    res.json({ message: 'Secure note updated successfully' });
  } catch (error) {
    console.error('Error updating secure note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.id;

    await pool.execute('DELETE FROM secure_notes WHERE id = ?', [noteId]);

    res.json({ message: 'Secure note deleted successfully' });
  } catch (error) {
    console.error('Error deleting secure note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
