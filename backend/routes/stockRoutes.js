const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { validateStock, validateStockAmount } = require('../middlewares/validation');
const { authenticateToken } = require('../middlewares/auth');
const dataSyncService = require('../services/DataSyncService');

// Public routes (no auth required)
// GET all stocks - anyone can view stocks
router.get('/', stockController.getAllStocks);

// GET filtered and sorted stocks - anyone can filter/sort stocks
router.get('/filteredAndSorted', stockController.getFilteredAndSortedStocks);

// These must come before /:name route to avoid conflicts
router.get('/filter/industry/:industry', stockController.getStocksByIndustry);
router.get('/filter/price', stockController.getStocksByPriceRange);
router.get('/sort/:sortBy', stockController.getSortedStocks);

// GET stock by name - anyone can view a specific stock
router.get('/:name', stockController.getStockByName);

// Protected routes (auth required)
// POST create a new stock
router.post('/', authenticateToken, validateStock, stockController.createStock);

// PUT update a stock (full update)
router.put('/:name', authenticateToken, validateStock, stockController.updateStock);

// PATCH update a stock (partial update)
router.patch('/:name', authenticateToken, validateStock, stockController.updateStock);

// PATCH update amount owned for a stock
router.patch('/:name/amount', authenticateToken, validateStockAmount, stockController.updateStockAmount);

// DELETE a stock
router.delete('/:name', authenticateToken, stockController.deleteStock);

// GET filtered and sorted stocks
router.get('/filter-sort/stocks', stockController.getFilteredAndSortedStocks);

// Admin only - Trigger full data synchronization between SQL and Sequelize
router.post('/admin/sync-data', authenticateToken, async (req, res) => {
    try {
        // Check if user has admin role
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        
        // Perform full sync
        const result = await dataSyncService.fullSyncStocks();
        
        // Return detailed result
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in data sync endpoint:', error);
        return res.status(500).json({ 
            message: 'Server error during data synchronization', 
            error: error.message 
        });
    }
});

module.exports = router; 