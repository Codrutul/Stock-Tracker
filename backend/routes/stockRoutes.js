const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { validateStock, validateStockAmount } = require('../middlewares/validation');

// GET all stocks
router.get('/', stockController.getAllStocks);

// GET filtered and sorted stocks (combines filtering and sorting in one request)
router.get('/filteredAndSorted', stockController.getFilteredAndSortedStocks);

// GET stock by name
router.get('/:name', stockController.getStockByName);

// POST create a new stock
router.post('/', validateStock, stockController.createStock);

// PUT update a stock (full update)
router.put('/:name', validateStock, stockController.updateStock);

// PATCH update a stock (partial update)
router.patch('/:name', validateStock, stockController.updateStock);

// PATCH update amount owned for a stock
router.patch('/:name/amount', validateStockAmount, stockController.updateStockAmount);

// DELETE a stock
router.delete('/:name', stockController.deleteStock);

// GET filtered stocks (by industry or price range)
router.get('/filter/industry/:industry', stockController.getStocksByIndustry);
router.get('/filter/price', stockController.getStocksByPriceRange);

// GET sorted stocks
router.get('/sort/:sortBy', stockController.getSortedStocks);

module.exports = router; 