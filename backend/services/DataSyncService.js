const pool = require('../db');
const { StockModel, PortfolioModel, UserModel, TagModel } = require('../models/sequelize');

/**
 * DataSyncService - Provides utilities to synchronize data between raw SQL and Sequelize ORM
 * This service helps maintain consistency across both database layers.
 */
class DataSyncService {
    /**
     * Synchronize all stock data from raw SQL to Sequelize
     * @returns {Promise<{success: boolean, message: string, count: number}>}
     */
    async syncStocksToSequelize() {
        try {
            console.log('🔄 DataSyncService: Syncing stocks from PostgreSQL to Sequelize...');
            
            // Get all stocks from raw SQL
            const result = await pool.query('SELECT * FROM stocks');
            if (result.rows.length === 0) {
                return {
                    success: true,
                    message: 'No stock data available to sync',
                    count: 0
                };
            }
            
            // For each stock in SQL, create or update in Sequelize
            let syncCount = 0;
            const errors = [];
            
            for (const stock of result.rows) {
                try {
                    await StockModel.upsert(stock);
                    syncCount++;
                } catch (err) {
                    console.error(`❌ Error syncing stock '${stock.name}' to Sequelize:`, err.message);
                    errors.push({
                        stockName: stock.name, 
                        error: err.message
                    });
                }
            }
            
            const successRate = (syncCount / result.rows.length) * 100;
            console.log(`✅ DataSyncService: Synchronized ${syncCount}/${result.rows.length} stocks (${successRate.toFixed(2)}%)`);
            
            return {
                success: true,
                message: `Synchronized ${syncCount}/${result.rows.length} stocks`,
                count: syncCount,
                errors: errors.length > 0 ? errors : undefined
            };
        } catch (error) {
            console.error('❌ DataSyncService: Error in syncStocksToSequelize:', error);
            return {
                success: false,
                message: `Error synchronizing stocks: ${error.message}`,
                count: 0
            };
        }
    }
    
    /**
     * Synchronize all stock data from Sequelize to raw SQL
     * @returns {Promise<{success: boolean, message: string, count: number}>}
     */
    async syncStocksFromSequelize() {
        try {
            console.log('🔄 DataSyncService: Syncing stocks from Sequelize to PostgreSQL...');
            
            // Get all stocks from Sequelize
            const stocks = await StockModel.findAll();
            if (stocks.length === 0) {
                return {
                    success: true,
                    message: 'No stock data available in Sequelize to sync',
                    count: 0
                };
            }
            
            let syncCount = 0;
            const errors = [];
            
            for (const stock of stocks) {
                try {
                    // Convert Sequelize model to plain object
                    const stockData = stock.get({ plain: true });
                    
                    // Check if stock exists in raw SQL
                    const existsResult = await pool.query(
                        'SELECT EXISTS(SELECT 1 FROM stocks WHERE name = $1)',
                        [stockData.name]
                    );
                    
                    if (existsResult.rows[0].exists) {
                        // Update existing stock
                        const fields = Object.keys(stockData).filter(key => 
                            key !== 'id' && key !== 'createdAt' && key !== 'updatedAt'
                        );
                        const values = fields.map(field => stockData[field]);
                        
                        // Create SET clause for the SQL query
                        const setClause = fields
                            .filter(field => field !== 'name')
                            .map((field, index) => `${field} = $${index + 2}`)
                            .join(', ');
                        
                        await pool.query(
                            `UPDATE stocks SET ${setClause} WHERE name = $1`,
                            [stockData.name, ...values.filter((_, i) => fields[i] !== 'name')]
                        );
                    } else {
                        // Insert new stock
                        const fields = Object.keys(stockData).filter(key => 
                            key !== 'id' && key !== 'createdAt' && key !== 'updatedAt'
                        );
                        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
                        const values = fields.map(field => stockData[field]);
                        
                        await pool.query(
                            `INSERT INTO stocks (${fields.join(', ')}) VALUES (${placeholders})`,
                            values
                        );
                    }
                    
                    syncCount++;
                } catch (err) {
                    console.error(`❌ Error syncing stock '${stock.name}' to PostgreSQL:`, err.message);
                    errors.push({
                        stockName: stock.name, 
                        error: err.message
                    });
                }
            }
            
            const successRate = (syncCount / stocks.length) * 100;
            console.log(`✅ DataSyncService: Synchronized ${syncCount}/${stocks.length} stocks from Sequelize (${successRate.toFixed(2)}%)`);
            
            return {
                success: true,
                message: `Synchronized ${syncCount}/${stocks.length} stocks from Sequelize`,
                count: syncCount,
                errors: errors.length > 0 ? errors : undefined
            };
        } catch (error) {
            console.error('❌ DataSyncService: Error in syncStocksFromSequelize:', error);
            return {
                success: false,
                message: `Error synchronizing stocks from Sequelize: ${error.message}`,
                count: 0
            };
        }
    }
    
    /**
     * Perform a full bi-directional sync of stocks between raw SQL and Sequelize
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async fullSyncStocks() {
        try {
            // First sync from SQL to Sequelize
            const sqlToSeqResult = await this.syncStocksToSequelize();
            
            // Then sync from Sequelize to SQL
            const seqToSqlResult = await this.syncStocksFromSequelize();
            
            return {
                success: true,
                message: 'Full stock synchronization completed',
                sqlToSequelize: sqlToSeqResult,
                sequelizeToSql: seqToSqlResult
            };
        } catch (error) {
            console.error('❌ DataSyncService: Error in fullSyncStocks:', error);
            return {
                success: false,
                message: `Error performing full stock synchronization: ${error.message}`
            };
        }
    }
}

module.exports = new DataSyncService(); 