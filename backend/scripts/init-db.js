/**
 * Database initialization script
 * This script will initialize the database with sample data for testing
 * Run with: node scripts/init-db.js
 */

const { sequelize, syncModels, UserModel, StockModel, TagModel, PortfolioModel, StockTagModel } = require('../models/sequelize');
const { faker } = require('@faker-js/faker');

// Sample data
const users = [
    { username: 'johndoe', email: 'john@example.com' },
    { username: 'janedoe', email: 'jane@example.com' },
    { username: 'bobsmith', email: 'bob@example.com' }
];

const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Energy',
    'Agriculture',
    'Manufacturing',
    'Consumer Cyclical',
    'Entertainment',
    'Automotive'
];

// Function to generate random stocks
const generateStocks = (count) => {
    const stocks = [];
    for (let i = 0; i < count; i++) {
        const name = faker.company.name();
        stocks.push({
            name,
            price: parseFloat(faker.finance.amount(1, 1000, 2)),
            amount_owned: 0,
            change: parseFloat(faker.finance.amount(-50, 50, 2)),
            image_src: 'src/assets/company_default.png',
            marketCap: parseInt(faker.finance.amount(1000000, 3000000000000, 0)),
            dividendAmount: parseFloat(faker.finance.amount(0, 10, 2)),
            industry: faker.helpers.arrayElement(industries),
            headquarters: `${faker.location.city()}, ${faker.location.state()}`,
            peRatio: parseFloat(faker.finance.amount(5, 100, 2))
        });
    }
    return stocks;
};

// Tags for many-to-many relationship
const tags = [
    { name: 'Trending', category: 'popularity' },
    { name: 'Top Performer', category: 'performance' },
    { name: 'Dividend King', category: 'dividends' },
    { name: 'Growth', category: 'strategy' },
    { name: 'Value', category: 'strategy' },
    { name: 'Blue Chip', category: 'stability' },
    { name: 'Risky', category: 'risk' },
    { name: 'Undervalued', category: 'analysis' },
    { name: 'Overvalued', category: 'analysis' },
    { name: 'ESG Friendly', category: 'sustainability' }
];

async function initializeDatabase() {
    try {
        console.log('🔄 Starting database initialization...');
        
        // Sync models (force false to NOT drop existing tables)
        await syncModels(false);
        console.log('✅ Database schema synchronized (non-destructive)');

        // Check if data already exists to prevent re-seeding
        // We'll check if the UserModel has any entries. If so, assume DB is seeded.
        const existingUser = await UserModel.findOne();
        if (existingUser) {
            console.log('ℹ️ Data already seems to exist (found a user). Skipping seeding process.');
            await sequelize.close(); // Still close the connection
            return; // Exit if data is likely already there
        }
        
        // Create users
        console.log('🔄 Creating users (database appears to be empty)...');
        const createdUsers = await UserModel.bulkCreate(users);
        console.log(`✅ Created ${createdUsers.length} users`);
        
        // Create stocks
        console.log('🔄 Creating stocks...');
        const stocks = generateStocks(20);
        const createdStocks = await StockModel.bulkCreate(stocks);
        console.log(`✅ Created ${createdStocks.length} stocks`);
        
        // Create tags
        console.log('🔄 Creating tags...');
        const createdTags = await TagModel.bulkCreate(tags);
        console.log(`✅ Created ${createdTags.length} tags`);
        
        // Create portfolio entries (one-to-many relationship)
        console.log('🔄 Creating portfolio entries...');
        const portfolioEntries = [];
        
        for (const user of createdUsers) {
            // Each user gets 3-10 random stocks
            const userStocksCount = faker.number.int({ min: 3, max: 10 });
            const userStocks = faker.helpers.arrayElements(createdStocks, userStocksCount);
            
            for (const stock of userStocks) {
                portfolioEntries.push({
                    userId: user.id,
                    stockName: stock.name,
                    quantity: parseFloat(faker.finance.amount(1, 100, 2)),
                    purchasePrice: parseFloat(faker.finance.amount(1, 500, 2)),
                    purchaseDate: faker.date.past(),
                    notes: faker.lorem.sentence()
                });
            }
        }
        
        const createdPortfolioEntries = await PortfolioModel.bulkCreate(portfolioEntries);
        console.log(`✅ Created ${createdPortfolioEntries.length} portfolio entries`);
        
        // Create stock-tag relationships (many-to-many)
        console.log('🔄 Creating stock-tag relationships...');
        const stockTagRelations = [];
        
        for (const stock of createdStocks) {
            // Each stock gets 1-5 random tags
            const stockTagsCount = faker.number.int({ min: 1, max: 5 });
            const stockTags = faker.helpers.arrayElements(createdTags, stockTagsCount);
            
            for (const tag of stockTags) {
                stockTagRelations.push({
                    stockName: stock.name,
                    tagId: tag.id
                });
            }
        }
        
        const createdStockTagRelations = await StockTagModel.bulkCreate(stockTagRelations);
        console.log(`✅ Created ${createdStockTagRelations.length} stock-tag relationships`);
        
        console.log('✅ Database initialization completed successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    } finally {
        // Close the database connection
        await sequelize.close();
    }
}

// Run the initialization
initializeDatabase(); 