/**
 * Script to create a test user for development and debugging
 * Run with: node scripts/create-test-user.js
 */

const UserRepo = require('../models/UserRepo');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../database.env') });

async function createTestUser() {
    try {
        console.log('🔧 Starting test user creation script...');
        
        // Initialize user table
        await UserRepo.initialize();
        
        // Test user credentials - NEVER use in production
        const testUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'regular'
        };
        
        // Check if test user already exists
        const exists = await UserRepo.userExists(testUser.username);
        if (exists) {
            console.log(`⚠️ Test user '${testUser.username}' already exists. Skipping creation.`);
            process.exit(0);
        }
        
        // Create test user
        const newUser = await UserRepo.createUser(testUser);
        
        console.log(`✅ Test user created successfully:`);
        console.log(`Username: ${testUser.username}`);
        console.log(`Password: ${testUser.password}`);
        console.log(`Email: ${testUser.email}`);
        console.log(`Role: ${newUser.role}`);
        console.log(`ID: ${newUser.id}`);
        
        console.log('\n📝 You can now login with these credentials for testing.');
        
    } catch (error) {
        console.error('❌ Error creating test user:', error);
    } finally {
        process.exit(0);
    }
}

// Run the function
createTestUser(); 