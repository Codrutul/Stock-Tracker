const StockRepo = require('../models/StockRepo');
const Stock = require('../models/Stock');
const { faker } = require('@faker-js/faker');

// Generate random stock data for a given name
const generateRandomStock = (name) => {
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

    // Helper function to generate random number in range
    const randomNumber = (min, max, decimals = 2) => {
        const num = Math.random() * (max - min) + min;
        return Number(num.toFixed(decimals));
    };
    
    return {
        name,
        price: randomNumber(1, 1000),
        amount_owned: 0,
        change: randomNumber(-50, 50),
        image_src: 'src/assets/company_default.png',
        marketCap: faker.number.int({ min: 1000000, max: 3000000000000 }), // $1M to $3T
        dividendAmount: randomNumber(0, 10),
        industry: faker.helpers.arrayElement(industries),
        headquarters: `${faker.location.city()}, ${faker.location.state()}`,
        peRatio: randomNumber(5, 100)
    };
};

// Get all stocks with pagination
exports.getAllStocks = async (req, res) => {
    try {
        // Extract pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        
        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 500) {
            return res.status(400).json({ 
                message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 500.' 
            });
        }
        
        // Get stocks with pagination
        const stocks = await StockRepo.getAllStocks(page, limit);
        
        // Get total count for pagination metadata
        const totalStocks = await StockRepo.getTotalStockCount();
        const totalPages = Math.ceil(totalStocks / limit);
        
        res.status(200).json({
            data: stocks,
            pagination: {
                page,
                limit,
                totalItems: totalStocks,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error in getAllStocks controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get stock by name
exports.getStockByName = async (req, res) => {
    try {
        const { name } = req.params;
        const stock = await StockRepo.getStockByName(name);
        
        if (!stock) {
            return res.status(404).json({ message: `Stock '${name}' not found` });
        }
        
        res.status(200).json(stock);
    } catch (error) {
        console.error('Error in getStockByName controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a new stock
exports.createStock = async (req, res) => {
    try {
        const stockData = req.body;
        
        console.log('📝 Received create stock request:', JSON.stringify(stockData));
        console.log('👤 User info:', req.user ? `ID: ${req.user.id}, Username: ${req.user.username}` : 'No user info available');
        
        // Validate required fields
        if (!stockData.name) {
            console.log('❌ Stock creation failed: Missing name');
            return res.status(400).json({ message: 'Stock name is required' });
        }
        
        // Check if stock already exists
        const exists = await StockRepo.stockExists(stockData.name);
        if (exists) {
            console.log(`❌ Stock creation failed: Stock '${stockData.name}' already exists`);
            return res.status(409).json({ message: `Stock '${stockData.name}' already exists` });
        }
        
        // If only name is provided, generate random stock data
        let stockToAdd = stockData;
        
        if (Object.keys(stockData).length === 1 && stockData.name) {
            console.log(`🎲 Generating random data for stock: ${stockData.name}`);
            stockToAdd = generateRandomStock(stockData.name);
        } else {
            // Ensure all fields are properly set with default values if needed
            stockToAdd = {
                name: stockData.name,
                price: stockData.price || 0,
                amount_owned: stockData.amount_owned || 0,
                change: stockData.change || 0,
                image_src: stockData.image_src || 'src/assets/company_default.png',
                marketCap: stockData.marketCap || 0,
                dividendAmount: stockData.dividendAmount || 0,
                industry: stockData.industry || 'Technology',
                headquarters: stockData.headquarters || 'Unknown',
                peRatio: stockData.peRatio || 0
            };
        }
        
        // Log the actual values to verify they are set correctly
        console.log('📊 Stock data to be added:', {
            ...stockToAdd,
            marketCap: `${stockToAdd.marketCap} (formatted: ${formatMarketCap(stockToAdd.marketCap)})`,
            dividendAmount: `${stockToAdd.dividendAmount} (formatted: ${stockToAdd.dividendAmount.toFixed(2)})`,
            peRatio: `${stockToAdd.peRatio} (formatted: ${stockToAdd.peRatio.toFixed(2)})`
        });
        
        // Make sure the database table exists
        await StockRepo.initialize();
        
        const newStock = await StockRepo.addStock(stockToAdd);
        
        if (!newStock) {
            console.log(`❌ Failed to add stock: ${stockData.name}`);
            return res.status(500).json({ message: `Failed to add stock '${stockData.name}'` });
        }
        
        console.log('✅ Successfully created stock:', newStock);
        
        // Broadcast to WebSocket clients that a new stock was added
        broadcastNewStock(newStock);
        
        res.status(201).json(newStock);
    } catch (error) {
        console.error('❌ Error in createStock controller:', error);
        res.status(500).json({ 
            message: 'Failed to add stock',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Helper function to broadcast a new stock to WebSocket clients
// Define this at the module level
function broadcastNewStock(stock) {
    try {
        // Check if the WebSocket broadcast function exists (it should be imported or provided)
        if (typeof global.broadcastData === 'function') {
            global.broadcastData({
                type: 'newStock',
                stock: stock
            });
            console.log('📡 Broadcasted new stock to connected clients');
        } else {
            console.log('⚠️ WebSocket broadcast function not available');
        }
    } catch (error) {
        console.error('❌ Error broadcasting new stock:', error);
        // Don't throw the error as broadcasting is optional
    }
}

// Helper function to format market cap for logging
function formatMarketCap(marketCap) {
    if (marketCap === undefined || marketCap === null) return "N/A";
    
    if (marketCap >= 1000000000000) {
        return `${(marketCap / 1000000000000).toFixed(2)}T$`;
    } else if (marketCap >= 1000000000) {
        return `${(marketCap / 1000000000).toFixed(2)}B$`;
    } else if (marketCap >= 1000000) {
        return `${(marketCap / 1000000).toFixed(2)}M$`;
    }
    return `${marketCap.toLocaleString()}$`;
}

// Update a stock
exports.updateStock = async (req, res) => {
    try {
        const { name } = req.params;
        const stockData = req.body;
        
        // Check if stock exists
        const exists = await StockRepo.stockExists(name);
        if (!exists) {
            return res.status(404).json({ message: `Stock '${name}' not found` });
        }
        
        const updatedStock = await StockRepo.updateStock(name, stockData);
        res.status(200).json(updatedStock);
    } catch (error) {
        console.error('Error in updateStock controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a stock
exports.deleteStock = async (req, res) => {
    try {
        const { name } = req.params;
        
        console.log(`🔄 Attempting to delete stock: ${name}`);
        
        // Check if stock exists
        const exists = await StockRepo.stockExists(name);
        if (!exists) {
            console.log(`❌ Stock not found: ${name}`);
            return res.status(404).json({ message: `Stock '${name}' not found` });
        }
        
        console.log(`✅ Stock exists, proceeding with deletion: ${name}`);
        
        // Get the stock before deletion for logging purposes
        const stockBeforeDeletion = await StockRepo.getStockByName(name);
        console.log('Stock to be deleted:', stockBeforeDeletion);
        
        const deletedStock = await StockRepo.deleteStock(name);
        
        if (!deletedStock) {
            console.log(`❌ Deletion failed for stock: ${name}`);
            return res.status(500).json({ message: `Failed to delete stock '${name}'` });
        }
        
        console.log(`✅ Successfully deleted stock: ${name}`);
        res.status(200).json({ message: `Stock '${name}' deleted successfully`, deletedStock });
    } catch (error) {
        console.error(`❌ Error in deleteStock controller for ${req.params.name}:`, error);
        res.status(500).json({ 
            message: `Error removing ${req.params.name}`,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get stocks by industry with pagination
exports.getStocksByIndustry = async (req, res) => {
    try {
        const { industry } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        
        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 500) {
            return res.status(400).json({ 
                message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 500.' 
            });
        }
        
        const stocks = await StockRepo.getStocksByIndustry(industry, page, limit);
        
        // Get total count for industry for pagination
        const totalStocks = industry === 'All' 
            ? await StockRepo.getTotalStockCount()
            : await StockRepo.getFilteredStockCount({ industry });
            
        const totalPages = Math.ceil(totalStocks / limit);
        
        res.status(200).json({
            data: stocks,
            pagination: {
                page,
                limit,
                totalItems: totalStocks,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error in getStocksByIndustry controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get stocks by price range with pagination
exports.getStocksByPriceRange = async (req, res) => {
    try {
        const { min = 0, max = Number.MAX_SAFE_INTEGER } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        
        // Validate price range parameters
        if (isNaN(min) || isNaN(max)) {
            return res.status(400).json({ message: 'Min and max must be numbers' });
        }
        
        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 500) {
            return res.status(400).json({ 
                message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 500.' 
            });
        }
        
        const minPrice = parseFloat(min);
        const maxPrice = parseFloat(max);
        
        const stocks = await StockRepo.getStocksByPriceRange(minPrice, maxPrice, page, limit);
        
        // Get total count for price range for pagination
        const totalStocks = await StockRepo.getFilteredStockCount({ 
            minPrice, 
            maxPrice 
        });
        
        const totalPages = Math.ceil(totalStocks / limit);
        
        res.status(200).json({
            data: stocks,
            pagination: {
                page,
                limit,
                totalItems: totalStocks,
                totalPages,
                priceRange: { min: minPrice, max: maxPrice }
            }
        });
    } catch (error) {
        console.error('Error in getStocksByPriceRange controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get sorted stocks (replaced with optimized filtered and sorted method)
exports.getSortedStocks = async (req, res) => {
    try {
        const { sortBy } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        
        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 500) {
            return res.status(400).json({ 
                message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 500.' 
            });
        }
        
        // Use the optimized filtered and sorted method
        const sortDirection = req.query.direction || 'ASC';
        const stocks = await StockRepo.getFilteredAndSortedStocks({
            sortBy,
            sortDirection,
            page,
            limit
        });
        
        // Get total count for pagination
        const totalStocks = await StockRepo.getTotalStockCount();
        const totalPages = Math.ceil(totalStocks / limit);
        
        res.status(200).json({
            data: stocks,
            pagination: {
                page,
                limit,
                totalItems: totalStocks,
                totalPages,
                sortBy,
                sortDirection
            }
        });
    } catch (error) {
        console.error('Error in getSortedStocks controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update stock amount
exports.updateStockAmount = async (req, res) => {
    try {
        const { name } = req.params;
        const { amount_owned } = req.body;
        
        console.log(`Updating amount for stock '${name}' to ${amount_owned}`);
        
        // Validate input
        if (amount_owned === undefined) {
            return res.status(400).json({ message: 'Amount owned is required' });
        }
        
        // Make sure amount is a number and not negative
        const parsedAmount = parseFloat(amount_owned);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            return res.status(400).json({ message: 'Amount must be a non-negative number' });
        }
        
        // Check if stock exists
        const exists = await StockRepo.stockExists(name);
        console.log(`Stock '${name}' exists check result: ${exists}`);
        
        if (!exists) {
            console.log(`Stock '${name}' not found in database, checking in-memory fallback...`);
            // Try to add the stock if it doesn't exist (could be using in-memory data)
            try {
                const randomStock = generateRandomStock(name);
                const newStock = await StockRepo.addStock(randomStock);
                
                if (newStock) {
                    console.log(`Created new stock '${name}' since it didn't exist`);
                    
                    // Update the newly created stock
                    const updatedStock = await StockRepo.updateStock(name, {
                        ...newStock,
                        amount_owned: parsedAmount
                    });
                    
                    console.log('Successfully updated stock amount:', updatedStock);
                    return res.status(200).json(updatedStock);
                }
            } catch (createError) {
                console.error(`Failed to create missing stock: ${createError.message}`);
            }
            
            return res.status(404).json({ message: `Stock '${name}' not found` });
        }
        
        // Get current stock to preserve other values
        const currentStock = await StockRepo.getStockByName(name);
        console.log(`Current stock data for '${name}':`, currentStock);
        
        if (!currentStock) {
            console.error(`Stock exists check passed but getStockByName failed for '${name}'`);
            return res.status(404).json({ message: `Stock '${name}' exists but data could not be retrieved` });
        }
        
        // Update only the amount owned
        const updatedStock = await StockRepo.updateStock(name, {
            ...currentStock,
            amount_owned: parsedAmount
        });
        
        if (!updatedStock) {
            console.error(`Failed to update stock '${name}', database may be inconsistent`);
            return res.status(500).json({ message: `Failed to update stock '${name}'` });
        }
        
        console.log('Successfully updated stock amount:', updatedStock);
        res.status(200).json(updatedStock);
    } catch (error) {
        console.error('Error in updateStockAmount controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get filtered and sorted stocks with pagination
exports.getFilteredAndSortedStocks = async (req, res) => {
    try {
        const { 
            industry, 
            min, 
            max, 
            sortBy = 'name', 
            direction = 'ASC',
            page = 1,
            limit = 100
        } = req.query;
        
        console.log(`Processing filtered and sorted request:`, { 
            industry, min, max, sortBy, direction, page, limit 
        });
        
        // Parse and validate numeric parameters
        const minPrice = min !== undefined ? parseFloat(min) : 0;
        const maxPrice = max !== undefined ? parseFloat(max) : Number.MAX_SAFE_INTEGER;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(minPrice) || isNaN(maxPrice)) {
            return res.status(400).json({ message: 'Min and max must be numbers' });
        }
        
        // Validate pagination parameters
        if (pageNum < 1 || limitNum < 1 || limitNum > 500) {
            return res.status(400).json({ 
                message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 500.' 
            });
        }
        
        // Map frontend sort options to database column names
        let dbSortBy = 'name';
        console.log(`Received sortBy parameter: "${sortBy}"`);
        
        // Check if sortBy is already a column name (from API) or a UI label (from frontend)
        if (['name', 'price', 'marketCap', 'change', 'dividendAmount', 'amount_owned'].includes(sortBy)) {
            dbSortBy = sortBy;
        } else {
            // Handle UI labels
            if (sortBy === 'Stock Price') dbSortBy = 'price';
            else if (sortBy === 'Company Market Cap') dbSortBy = 'marketCap';
            else if (sortBy === 'Growth in the last month') dbSortBy = 'change';
            else if (sortBy === 'Dividend amount') dbSortBy = 'dividendAmount';
            else if (sortBy === 'Amount owned') dbSortBy = 'amount_owned';
        }
        
        console.log(`Mapped sortBy parameter "${sortBy}" to database column "${dbSortBy}"`);
        
        // Use the optimized repository method
        const stocks = await StockRepo.getFilteredAndSortedStocks({
            industry: industry === 'All' ? null : industry,
            minPrice,
            maxPrice,
            sortBy: dbSortBy,
            sortDirection: direction,
            page: pageNum,
            limit: limitNum
        });
        
        // Get total count for filtered results
        const totalStocks = await StockRepo.getFilteredStockCount({
            industry: industry === 'All' ? null : industry,
            minPrice,
            maxPrice
        });
        
        const totalPages = Math.ceil(totalStocks / limitNum);
        
        console.log(`Found ${stocks.length} stocks matching criteria. Total count: ${totalStocks}`);
        
        res.status(200).json({
            data: stocks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems: totalStocks,
                totalPages,
                filters: {
                    industry: industry || 'All',
                    priceRange: { min: minPrice, max: maxPrice }
                },
                sorting: {
                    sortBy: dbSortBy,
                    direction
                }
            }
        });
    } catch (error) {
        console.error('Error in getFilteredAndSortedStocks controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 