const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

// Tag routes
router.get('/', tagController.getAllTags);
router.get('/filter', tagController.getFilteredAndSortedTags);
router.get('/:id', tagController.getTagById);
router.post('/', tagController.createTag);
router.put('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

// Stock-Tag relation routes
router.get('/stock/:stockName', tagController.getStockTags);
router.get('/:tagId/stocks', tagController.getStocksWithTag);
router.post('/stock/:stockName/tag/:tagId', tagController.assignTagToStock);
router.delete('/stock/:stockName/tag/:tagId', tagController.removeTagFromStock);

module.exports = router; 