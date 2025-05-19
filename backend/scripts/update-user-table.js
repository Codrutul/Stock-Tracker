/**
 * Script to update the users table by adding password and role columns
 * Run with: node scripts/update-user-table.js
 */

const pool = require('../db');

async function updateUsersTable() {
  try {
    console.log('Starting users table update...');
    
    // Check if the password column already exists
    const checkPasswordColumn = await pool.query(`
      SELECT column_name 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE table_name = 'users' AND column_name = 'password'
    `);
    
    // Check if the role column already exists
    const checkRoleColumn = await pool.query(`
      SELECT column_name 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    // Add password column if it doesn't exist
    if (checkPasswordColumn.rows.length === 0) {
      console.log('Adding password column to users table...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT 'defaultpassword'
      `);
      console.log('Password column added successfully');
    } else {
      console.log('Password column already exists');
    }
    
    // Add role column if it doesn't exist
    if (checkRoleColumn.rows.length === 0) {
      console.log('Adding role column to users table...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'regular'
      `);
      console.log('Role column added successfully');
    } else {
      console.log('Role column already exists');
    }
    
    // Create a default admin user if none exists
    const checkAdmin = await pool.query(`
      SELECT * FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    if (checkAdmin.rows.length === 0) {
      console.log('Creating default admin user...');
      
      // Simple hash for 'admin123' - in a real system, you'd use bcrypt properly
      const adminPassword = 'admin123password';
      const now = new Date().toISOString();
      
      await pool.query(`
        INSERT INTO users (username, email, password, role, created_at, updated_at)
        VALUES ('admin', 'admin@stocktracker.com', $1, 'admin', $2, $2)
        ON CONFLICT (username) DO UPDATE
        SET role = 'admin', password = $1, updated_at = $2
      `, [adminPassword, now]);
      
      console.log('Default admin user created/updated');
    } else {
      console.log('Admin user already exists');
    }
    
    // Update existing user passwords
    console.log('Updating existing users\' passwords...');
    await pool.query(`
      UPDATE users 
      SET password = 'password123'
      WHERE password = 'defaultpassword'
    `);
    console.log('Existing users updated with default password: password123');
    
    console.log('Users table update completed successfully');
  } catch (error) {
    console.error('Error updating users table:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the update function
updateUsersTable(); 