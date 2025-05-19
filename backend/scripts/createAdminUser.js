/**
 * Script to create an admin user for testing the monitoring system
 * Run with: node scripts/createAdminUser.js
 */

const UserRepo = require('../models/UserRepo');
const pool = require('../db');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../database.env') });

// Admin user details - you can modify these as needed
const adminUser = {
    username: 'adminUser',
    email: 'admin@gmail.com',
    password: 'admin_password', // In production, use a strong password!
    role: 'admin'
};

async function createAdminUser() {
    try {
        console.log('Checking if admin user already exists...');
        
        // Check if user already exists
        const exists = await UserRepo.userExists(adminUser.username);
        
        if (exists) {
            console.log(`User '${adminUser.username}' already exists.`);
            
            // Optionally update the user to have admin role
            console.log('Ensuring user has admin role...');
            const user = await UserRepo.getUserByUsername(adminUser.username);
            
            if (user.role !== 'admin') {
                await UserRepo.updateUser(user.id, {
                    ...user,
                    role: 'admin'
                });
                console.log(`Updated user '${adminUser.username}' to have admin role.`);
            } else {
                console.log(`User '${adminUser.username}' already has admin role.`);
            }
        } else {
            // Create new admin user
            console.log(`Creating new admin user: ${adminUser.username}`);
            const result = await UserRepo.createUser(adminUser);
            console.log('Admin user created successfully:');
            console.log(`- ID: ${result.id}`);
            console.log(`- Username: ${result.username}`);
            console.log(`- Email: ${result.email}`);
            console.log(`- Role: ${result.role}`);
            console.log(`- Created at: ${result.created_at}`);
        }
        
        console.log('\n✅ Admin user is ready to use');
        console.log('-----------------------------');
        console.log(`Username: ${adminUser.username}`);
        console.log(`Password: ${adminUser.password}`);
        console.log('-----------------------------');
        console.log('Use these credentials to login to the monitoring dashboard');
        
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        // Close the database connection
        await pool.end();
    }
}

// Run the script
createAdminUser(); 