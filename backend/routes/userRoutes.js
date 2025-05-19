const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const portfolioController = require('../controllers/portfolioController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// All user routes require authentication
router.use(authenticateToken);

// User routes
router.get('/', isAdmin, userController.getAllUsers); // Admin only
router.get('/:id', userController.getUserById);
router.get('/username/:username', userController.getUserByUsername);
router.post('/', isAdmin, userController.createUser); // Admin only
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Portfolio routes (related to users)
router.get('/:userId/portfolio', portfolioController.getUserPortfolio);
router.post('/:userId/portfolio', portfolioController.addStockToPortfolio);
router.put('/:userId/portfolio/:stockName', portfolioController.updatePortfolioEntry);
router.delete('/:userId/portfolio/:stockName', portfolioController.removeStockFromPortfolio);
router.get('/:userId/portfolio/filter', portfolioController.getFilteredAndSortedPortfolio);

module.exports = router; 