/**
 * Database massive data generation script
 * This script will populate the database with massive amounts of data for performance testing
 * Generates over 100,000 entries for each table
 * Run with: node scripts/generate-massive-data.js
 */

const { sequelize, syncModels, UserModel, StockModel, TagModel, PortfolioModel, StockTagModel } = require('../models/sequelize');
const { faker } = require('@faker-js/faker');
const readline = require('readline');

// Configuration
const BATCH_SIZE = 1000; // Insert records in batches for better performance
const TOTAL_USERS = 10000;
const TOTAL_STOCKS = 100000;
const TOTAL_TAGS = 1000;
const PORTFOLIOS_PER_USER_MIN = 5;
const PORTFOLIOS_PER_USER_MAX = 30;
const TAGS_PER_STOCK_MIN = 1;
const TAGS_PER_STOCK_MAX = 10;

// Array of industries for more realistic data
const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Energy',
    'Agriculture',
    'Manufacturing',
    'Consumer Cyclical',
    'Entertainment',
    'Automotive',
    'Telecommunications',
    'Real Estate',
    'Utilities',
    'Basic Materials',
    'Consumer Defensive',
    'Industrial Products',
    'Aerospace',
    'Biotechnology',
    'Retail',
    'Transportation',
    'Insurance'
];

// Progress tracking
let usersCreated = 0;
let stocksCreated = 0;
let tagsCreated = 0;
let portfolioEntriesCreated = 0;
let stockTagRelationsCreated = 0;

// Helper function to show progress
function updateProgress(message) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(message);
}

// Function to generate a batch of users
function generateUsers(count) {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push({
            username: faker.internet.userName() + '_' + faker.string.alphanumeric(8),
            email: faker.internet.email(),
        });
    }
    return users;
}

// Function to generate a batch of stocks
function generateStocks(count) {
    const stocks = [];
    for (let i = 0; i < count; i++) {
        const name = faker.company.name() + ' ' + faker.string.alphanumeric(6);
        stocks.push({
            name,
            price: parseFloat(faker.finance.amount(1, 10000, 2)),
            amount_owned: 0,
            change: parseFloat(faker.finance.amount(-99, 150, 2)),
            image_src: faker.image.url(),
            marketCap: BigInt(faker.number.int({ min: 1000000, max: Number.MAX_SAFE_INTEGER })),
            dividendAmount: parseFloat(faker.finance.amount(0, 50, 2)),
            industry: faker.helpers.arrayElement(industries),
            headquarters: `${faker.location.city()}, ${faker.location.country()}`,
            peRatio: parseFloat(faker.finance.amount(5, 100, 2))
        });
    }
    return stocks;
}

// Function to generate a batch of tags
function generateTags(count) {
    const tags = [];
    const categories = ['performance', 'analysis', 'risk', 'sector', 'trend', 'technical', 'fundamental', 'market', 'economic', 'recommendation'];
    
    for (let i = 0; i < count; i++) {
        tags.push({
            name: faker.word.adjective() + '-' + faker.string.alphanumeric(6),
            category: faker.helpers.arrayElement(categories)
        });
    }
    return tags;
}

// Main function to populate the database
async function populateDatabase() {
    try {
        console.log('🔄 Starting massive data generation...');
        
        // Sync models (false to preserve existing tables)
        await syncModels(false);
        console.log('✅ Database schema synchronized');
        
        // Create users in batches
        console.log('🔄 Creating users...');
        for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
            const batchSize = Math.min(BATCH_SIZE, TOTAL_USERS - i);
            const userBatch = generateUsers(batchSize);
            await UserModel.bulkCreate(userBatch, { ignoreDuplicates: true });
            usersCreated += batchSize;
            updateProgress(`Created ${usersCreated}/${TOTAL_USERS} users...`);
        }
        console.log(`\n✅ Created ${usersCreated} users`);
        
        // Create stocks in batches
        console.log('🔄 Creating stocks...');
        for (let i = 0; i < TOTAL_STOCKS; i += BATCH_SIZE) {
            const batchSize = Math.min(BATCH_SIZE, TOTAL_STOCKS - i);
            const stockBatch = generateStocks(batchSize);
            await StockModel.bulkCreate(stockBatch, { ignoreDuplicates: true });
            stocksCreated += batchSize;
            updateProgress(`Created ${stocksCreated}/${TOTAL_STOCKS} stocks...`);
        }
        console.log(`\n✅ Created ${stocksCreated} stocks`);
        
        // Create tags in batches
        console.log('🔄 Creating tags...');
        for (let i = 0; i < TOTAL_TAGS; i += BATCH_SIZE) {
            const batchSize = Math.min(BATCH_SIZE, TOTAL_TAGS - i);
            const tagBatch = generateTags(batchSize);
            await TagModel.bulkCreate(tagBatch, { ignoreDuplicates: true });
            tagsCreated += batchSize;
            updateProgress(`Created ${tagsCreated}/${TOTAL_TAGS} tags...`);
        }
        console.log(`\n✅ Created ${tagsCreated} tags`);
        
        // Get all users, stocks, and tags for creating relationships
        console.log('🔄 Fetching created entities for relationships...');
        const allUsers = await UserModel.findAll({ attributes: ['id'] });
        const allStocks = await StockModel.findAll({ attributes: ['name'] });
        const allTags = await TagModel.findAll({ attributes: ['id'] });
        
        console.log(`📊 Found ${allUsers.length} users, ${allStocks.length} stocks, and ${allTags.length} tags`);
        
        // Create portfolio entries (one-to-many relationship between users and stocks)
        console.log('🔄 Creating portfolio entries...');
        const totalPortfolioEntries = allUsers.length * PORTFOLIOS_PER_USER_MAX;
        let currentBatch = [];
        
        for (const user of allUsers) {
            // Each user gets a random number of stocks between min and max
            const userStocksCount = faker.number.int({ 
                min: PORTFOLIOS_PER_USER_MIN, 
                max: PORTFOLIOS_PER_USER_MAX 
            });
            
            // Randomly select stocks for this user
            const userStocks = faker.helpers.arrayElements(
                allStocks, 
                Math.min(userStocksCount, allStocks.length)
            );
            
            for (const stock of userStocks) {
                currentBatch.push({
                    userId: user.id,
                    stockName: stock.name,
                    quantity: parseFloat(faker.finance.amount(1, 10000, 2)),
                    purchasePrice: parseFloat(faker.finance.amount(1, 5000, 2)),
                    purchaseDate: faker.date.past({ years: 5 }),
                    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 })
                });
                
                if (currentBatch.length >= BATCH_SIZE) {
                    await PortfolioModel.bulkCreate(currentBatch, { 
                        ignoreDuplicates: true,
                        updateOnDuplicate: ["quantity", "purchasePrice"]
                    });
                    portfolioEntriesCreated += currentBatch.length;
                    updateProgress(`Created ${portfolioEntriesCreated} portfolio entries...`);
                    currentBatch = [];
                }
            }
        }
        
        // Insert any remaining portfolio entries
        if (currentBatch.length > 0) {
            await PortfolioModel.bulkCreate(currentBatch, { 
                ignoreDuplicates: true,
                updateOnDuplicate: ["quantity", "purchasePrice"]
            });
            portfolioEntriesCreated += currentBatch.length;
        }
        
        console.log(`\n✅ Created ${portfolioEntriesCreated} portfolio entries`);
        
        // Create stock-tag relationships (many-to-many)
        console.log('🔄 Creating stock-tag relationships...');
        currentBatch = [];
        
        for (const stock of allStocks) {
            // Each stock gets a random number of tags
            const stockTagsCount = faker.number.int({ 
                min: TAGS_PER_STOCK_MIN, 
                max: TAGS_PER_STOCK_MAX 
            });
            
            // Randomly select tags for this stock
            const stockTags = faker.helpers.arrayElements(
                allTags, 
                Math.min(stockTagsCount, allTags.length)
            );
            
            for (const tag of stockTags) {
                currentBatch.push({
                    stockName: stock.name,
                    tagId: tag.id
                });
                
                if (currentBatch.length >= BATCH_SIZE) {
                    await StockTagModel.bulkCreate(currentBatch, { ignoreDuplicates: true });
                    stockTagRelationsCreated += currentBatch.length;
                    updateProgress(`Created ${stockTagRelationsCreated} stock-tag relationships...`);
                    currentBatch = [];
                }
            }
        }
        
        // Insert any remaining stock-tag relationships
        if (currentBatch.length > 0) {
            await StockTagModel.bulkCreate(currentBatch, { ignoreDuplicates: true });
            stockTagRelationsCreated += currentBatch.length;
        }
        
        console.log(`\n✅ Created ${stockTagRelationsCreated} stock-tag relationships`);
        
        // Summary
        console.log('\n🎉 Database populated successfully with:');
        console.log(`📊 ${usersCreated} users`);
        console.log(`📊 ${stocksCreated} stocks`);
        console.log(`📊 ${tagsCreated} tags`);
        console.log(`📊 ${portfolioEntriesCreated} portfolio entries`);
        console.log(`📊 ${stockTagRelationsCreated} stock-tag relationships`);
        
    } catch (error) {
        console.error('❌ Error populating database:', error);
    } finally {
        // Close the database connection
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the population
populateDatabase(); 