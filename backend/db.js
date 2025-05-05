const { Pool } = require("pg");
const { sequelize, testConnection, syncModels } = require('./models/sequelize');
require("dotenv").config({ path: "./database.env" });

// Parse the DATABASE_URL manually to ensure credentials are handled correctly
const connectionString = process.env.DATABASE_URL;
console.log("Using connection string:", connectionString);

// Create the pool with explicit parameters
const pool = new Pool({
    connectionString,
    // Add SSL if needed (common for production)
    // ssl: { rejectUnauthorized: false }
});

// Test the connection
pool.on('connect', async () => {
    console.log('PostgreSQL connection established successfully');
    
    // Once the raw connection is established, test Sequelize connection
    await testConnection();
    
    // Sync Sequelize models
    await syncModels(false); // Set to true to force recreate tables (will drop existing data)
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;
