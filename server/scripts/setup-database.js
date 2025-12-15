const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
  let connection;

  try {
    // 1️⃣ Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3307, // keep your custom port
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true, // helpful if schema has multiple statements
    });

    console.log('📡 Connected to MySQL server');

    const dbName = process.env.DB_NAME;
    if (!dbName) {
      throw new Error('DB_NAME is not set in .env');
    }

    // 2️⃣ Create database if it doesn't exist (use query, not execute)
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`📊 Database '${dbName}' created/verified`);

    // 3️⃣ Switch to that database WITHOUT using "USE ..." via execute
    await connection.changeUser({ database: dbName });
    console.log(`🔄 Using database '${dbName}'`);

    // 4️⃣ Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements and execute
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length);

    for (const statement of statements) {
      // Use query instead of execute for generic DDL
      await connection.query(statement);
    }

    console.log('✅ Database schema created successfully');

    // 5️⃣ Create default users with hashed passwords
    const defaultPassword = 'password';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const defaultUsers = [
      {
        id: 'global-admin-001',
        username: 'globaladmin',
        name: 'Global Admin User',
        role: 'global-admin',
        modulePermissions: null,
      },
      {
        id: 'module-admin-001',
        username: 'moduleadmin',
        name: 'Module Admin User',
        role: 'module-admin',
        modulePermissions: JSON.stringify([
          'chapmancg-log',
          'internal-log',
          'software-licenses',
        ]),
      },
      {
        id: 'standard-user-001',
        username: 'standarduser',
        name: 'Standard User',
        role: 'standard-user',
        modulePermissions: null,
      },
    ];

    for (const user of defaultUsers) {
      await connection.query(
        'INSERT IGNORE INTO users (id, username, password_hash, name, role, module_permissions) VALUES (?, ?, ?, ?, ?, ?)',
        [
          user.id,
          user.username,
          hashedPassword,
          user.name,
          user.role,
          user.modulePermissions,
        ]
      );
    }

    console.log('👥 Default users created');
    console.log('🔐 Default password for all users: "password"');
    console.log('');
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your .env file with your MySQL credentials (if needed)');
    console.log('2. Run "npm run dev" to start the development server');
    console.log('3. The frontend will connect to your MySQL database');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

setupDatabase();
