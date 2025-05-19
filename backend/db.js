const { Pool } = require("pg");
const { sequelize, testConnection, syncModels, StockModel } = require('./models/sequelize');
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, "./database.env") });

// Parse the DATABASE_URL and log it (redact password for security)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables. Make sure database.env is properly set up.');
    process.exit(1); // Exit if no database URL is provided
}

// Create the pool with explicit parameters
let pool;
try {
    pool = new Pool({
        connectionString,
        // Increase connection timeout to 30 seconds
        connectionTimeoutMillis: 30000,
        // Add SSL if needed (common for production)
        ssl: { rejectUnauthorized: false },
        // Add retry logic
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
        maxUses: 7500, // Close a client after it has been used this many times
    });

    // Log sanitized connection string (replace password with **)
    const sanitizedConnString = connectionString ? 
        connectionString.replace(/:[^:]*@/, ':****@') : 
        'No connection string available';
    console.log(`🔌 Attempting PostgreSQL connection with: ${sanitizedConnString}`);
} catch (error) {
    console.error('❌ Error creating PostgreSQL pool:', error);
    process.exit(1); // Exit if we can't create the pool
}

// Synchronize existing stock data between raw SQL and Sequelize
async function syncExistingData() {
    try {
        console.log('🔄 Synchronizing existing stock data between PostgreSQL and Sequelize...');
        
        // Get all stocks from raw SQL
        const result = await pool.query('SELECT * FROM stocks');
        if (result.rows.length === 0) {
            console.log('ℹ️ No existing stock data found in PostgreSQL to sync.');
            return;
        }
        
        // For each stock in SQL, create or update in Sequelize
        let syncCount = 0;
        for (const stock of result.rows) {
            try {
                await StockModel.upsert(stock);
                syncCount++;
            } catch (err) {
                console.error(`❌ Error syncing stock ${stock.name} to Sequelize:`, err);
            }
        }
        
        console.log(`✅ Successfully synchronized ${syncCount}/${result.rows.length} stocks to Sequelize.`);
    } catch (error) {
        console.error('❌ Error synchronizing existing stock data:', error);
    }
}

// Test the connection
pool.on('connect', async () => {
    console.log('✅ PostgreSQL connection established successfully');
    
    try {
        // Once the raw connection is established, test Sequelize connection
        await testConnection();
        
        // Sync Sequelize models
        await syncModels(false); // Set to true to force recreate tables (will drop existing data)
        
        // Synchronize existing data between PostgreSQL and Sequelize
        await syncExistingData();
    } catch (error) {
        console.error('❌ Error connecting to Sequelize or syncing models:', error);
    }
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client:', err);
    // Don't exit the process, allow the app to continue with in-memory fallback
    // process.exit(-1);
});

module.exports = pool;
