const PortfolioRepo = require('../models/PortfolioRepo');
const UserRepo = require('../models/UserRepo');
const StockRepo = require('../models/StockRepo');
const Portfolio = require('../models/Portfolio');

// Get user portfolio
exports.getUserPortfolio = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists
        const user = await UserRepo.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: `User with ID ${userId} not found` });
        }
        
        const portfolio = await PortfolioRepo.getUserPortfolio(userId);
        res.status(200).json(portfolio);
    } catch (error) {
        console.error('Error in getUserPortfolio controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add stock to portfolio
exports.addStockToPortfolio = async (req, res) => {
    try {
        const { userId } = req.params;
        const portfolioData = req.body;
        
        // Validate required fields
        if (!portfolioData.stockName) {
            return res.status(400).json({ message: 'Stock name is required' });
        }
        
        // Check if user exists
        const user = await UserRepo.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: `User with ID ${userId} not found` });
        }
        
        // Check if stock exists
        const stockExists = await StockRepo.stockExists(portfolioData.stockName);
        if (!stockExists) {
            return res.status(404).json({ message: `Stock '${portfolioData.stockName}' not found` });
        }
        
        // Check if stock is already in portfolio
        const existingEntry = await PortfolioRepo.getPortfolioEntry(userId, portfolioData.stockName);
        if (existingEntry) {
            return res.status(409).json({ 
                message: `Stock '${portfolioData.stockName}' already exists in user's portfolio`,
                portfolioEntry: existingEntry
            });
        }
        
        // Prepare portfolio data
        const portfolioEntry = {
            userId,
            stockName: portfolioData.stockName,
            quantity: portfolioData.quantity || 0,
            purchasePrice: portfolioData.purchasePrice || 0,
            notes: portfolioData.notes || ''
        };
        
        // Add stock to portfolio
        const newEntry = await PortfolioRepo.addStockToPortfolio(portfolioEntry);
        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error in addStockToPortfolio controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update portfolio entry
exports.updatePortfolioEntry = async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const portfolioData = req.body;
        
        // Check if portfolio entry exists
        const entry = await PortfolioRepo.getPortfolioEntryById(portfolioId);
        if (!entry) {
            return res.status(404).json({ message: `Portfolio entry with ID ${portfolioId} not found` });
        }
        
        // Update portfolio entry
        const updatedEntry = await PortfolioRepo.updatePortfolioEntry(portfolioId, portfolioData);
        res.status(200).json(updatedEntry);
    } catch (error) {
        console.error('Error in updatePortfolioEntry controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Remove stock from portfolio
exports.removeStockFromPortfolio = async (req, res) => {
    try {
        const { userId, stockName } = req.params;
        
        // Check if portfolio entry exists
        const entry = await PortfolioRepo.getPortfolioEntry(userId, stockName);
        if (!entry) {
            return res.status(404).json({ 
                message: `Stock '${stockName}' not found in user's portfolio` 
            });
        }
        
        // Remove stock from portfolio
        const removedEntry = await PortfolioRepo.removeStockFromPortfolio(userId, stockName);
        res.status(200).json({ 
            message: `Stock '${stockName}' removed from user's portfolio`,
            removedEntry 
        });
    } catch (error) {
        console.error('Error in removeStockFromPortfolio controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get users who own a specific stock
exports.getUsersOwningStock = async (req, res) => {
    try {
        const { stockName } = req.params;
        
        // Check if stock exists
        const stockExists = await StockRepo.stockExists(stockName);
        if (!stockExists) {
            return res.status(404).json({ message: `Stock '${stockName}' not found` });
        }
        
        const users = await PortfolioRepo.getUsersOwningStock(stockName);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error in getUsersOwningStock controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get filtered and sorted portfolio
exports.getFilteredAndSortedPortfolio = async (req, res) => {
    try {
        const { userId } = req.params;
        const { industry, minPrice, maxPrice, sortBy } = req.query;
        
        // Check if user exists
        const user = await UserRepo.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: `User with ID ${userId} not found` });
        }
        
        // Parse numeric values
        const parsedMinPrice = minPrice ? parseFloat(minPrice) : 0;
        const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : Number.MAX_SAFE_INTEGER;
        
        // Get filtered and sorted portfolio
        const portfolio = await PortfolioRepo.getFilteredAndSortedPortfolio(
            userId,
            industry || null,
            parsedMinPrice,
            parsedMaxPrice,
            sortBy || 'purchase_date'
        );
        
        res.status(200).json(portfolio);
    } catch (error) {
        console.error('Error in getFilteredAndSortedPortfolio controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 