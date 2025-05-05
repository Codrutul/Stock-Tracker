const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: "./database.env" });

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: console.log,
    dialectOptions: {
        // SSL configuration if needed
        // ssl: {
        //     require: true,
        //     rejectUnauthorized: false
        // }
    }
});

// Import models
const StockModel = require('./stock.model')(sequelize);
const UserModel = require('./user.model')(sequelize);
const PortfolioModel = require('./portfolio.model')(sequelize);
const TagModel = require('./tag.model')(sequelize);
const StockTagModel = require('./stockTag.model')(sequelize);

// Define associations
UserModel.hasMany(PortfolioModel, {
    foreignKey: 'userId',
    as: 'portfolioEntries',
    onDelete: 'CASCADE'
});

PortfolioModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user'
});

StockModel.hasMany(PortfolioModel, {
    foreignKey: 'stockName',
    sourceKey: 'name',
    as: 'portfolioEntries',
    onDelete: 'CASCADE'
});

PortfolioModel.belongsTo(StockModel, {
    foreignKey: 'stockName',
    targetKey: 'name',
    as: 'stock'
});

// Many-to-many relationship between Stocks and Tags
StockModel.belongsToMany(TagModel, {
    through: StockTagModel,
    foreignKey: 'stockName',
    sourceKey: 'name',
    otherKey: 'tagId',
    as: 'tags'
});

TagModel.belongsToMany(StockModel, {
    through: StockTagModel,
    foreignKey: 'tagId',
    otherKey: 'stockName',
    targetKey: 'name',
    as: 'stocks'
});

// Test the connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Sequelize connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database with Sequelize:', error);
        return false;
    }
}

// Sync all models with the database
async function syncModels(force = false) {
    try {
        await sequelize.sync({ force });
        console.log('✅ All models were synchronized successfully.');
        return true;
    } catch (error) {
        console.error('❌ Error synchronizing models:', error);
        return false;
    }
}

module.exports = {
    sequelize,
    Sequelize,
    StockModel,
    UserModel,
    PortfolioModel,
    TagModel,
    StockTagModel,
    testConnection,
    syncModels
}; 