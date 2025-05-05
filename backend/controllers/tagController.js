const TagRepo = require('../models/TagRepo');
const StockRepo = require('../models/StockRepo');
const Tag = require('../models/Tag');

// Get all tags
exports.getAllTags = async (req, res) => {
    try {
        const tags = await TagRepo.getAllTags();
        res.status(200).json(tags);
    } catch (error) {
        console.error('Error in getAllTags controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get tag by ID
exports.getTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const tag = await TagRepo.getTagById(id);
        
        if (!tag) {
            return res.status(404).json({ message: `Tag with ID ${id} not found` });
        }
        
        res.status(200).json(tag);
    } catch (error) {
        console.error('Error in getTagById controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a new tag
exports.createTag = async (req, res) => {
    try {
        const tagData = req.body;
        
        // Validate required fields
        if (!tagData.name) {
            return res.status(400).json({ message: 'Tag name is required' });
        }
        
        // Check if tag with the same name already exists
        const existingTag = await TagRepo.getTagByName(tagData.name);
        if (existingTag) {
            return res.status(409).json({ 
                message: `Tag with name '${tagData.name}' already exists`,
                tag: existingTag
            });
        }
        
        // Create new tag
        const newTag = await TagRepo.createTag(tagData);
        res.status(201).json(newTag);
    } catch (error) {
        console.error('Error in createTag controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update a tag
exports.updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const tagData = req.body;
        
        // Check if tag exists
        const tag = await TagRepo.getTagById(id);
        if (!tag) {
            return res.status(404).json({ message: `Tag with ID ${id} not found` });
        }
        
        // Check if name is changing and if the new name is already taken
        if (tagData.name && tagData.name !== tag.name) {
            const existingTag = await TagRepo.getTagByName(tagData.name);
            if (existingTag) {
                return res.status(409).json({ 
                    message: `Tag with name '${tagData.name}' already exists`,
                    tag: existingTag
                });
            }
        }
        
        // Update tag
        const updatedTag = await TagRepo.updateTag(id, tagData);
        res.status(200).json(updatedTag);
    } catch (error) {
        console.error('Error in updateTag controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a tag
exports.deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if tag exists
        const tag = await TagRepo.getTagById(id);
        if (!tag) {
            return res.status(404).json({ message: `Tag with ID ${id} not found` });
        }
        
        // Delete tag
        const deletedTag = await TagRepo.deleteTag(id);
        res.status(200).json({ 
            message: `Tag with ID ${id} deleted successfully`,
            deletedTag
        });
    } catch (error) {
        console.error('Error in deleteTag controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Assign tag to stock
exports.assignTagToStock = async (req, res) => {
    try {
        const { stockName, tagId } = req.params;
        
        // Check if stock exists
        const stockExists = await StockRepo.stockExists(stockName);
        if (!stockExists) {
            return res.status(404).json({ message: `Stock '${stockName}' not found` });
        }
        
        // Check if tag exists
        const tag = await TagRepo.getTagById(tagId);
        if (!tag) {
            return res.status(404).json({ message: `Tag with ID ${tagId} not found` });
        }
        
        // Assign tag to stock
        const relation = await TagRepo.assignTagToStock(stockName, tagId);
        res.status(200).json({ 
            message: `Tag '${tag.name}' assigned to stock '${stockName}'`,
            relation
        });
    } catch (error) {
        console.error('Error in assignTagToStock controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Remove tag from stock
exports.removeTagFromStock = async (req, res) => {
    try {
        const { stockName, tagId } = req.params;
        
        // Check if the relationship exists (implicit check for stock and tag existence)
        const removed = await TagRepo.removeTagFromStock(stockName, tagId);
        if (!removed) {
            return res.status(404).json({ 
                message: `Tag with ID ${tagId} is not assigned to stock '${stockName}'` 
            });
        }
        
        // Return success
        res.status(200).json({ 
            message: `Tag with ID ${tagId} removed from stock '${stockName}'`,
            removed
        });
    } catch (error) {
        console.error('Error in removeTagFromStock controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all tags for a stock
exports.getStockTags = async (req, res) => {
    try {
        const { stockName } = req.params;
        
        // Check if stock exists
        const stockExists = await StockRepo.stockExists(stockName);
        if (!stockExists) {
            return res.status(404).json({ message: `Stock '${stockName}' not found` });
        }
        
        // Get tags for stock
        const tags = await TagRepo.getStockTags(stockName);
        res.status(200).json(tags);
    } catch (error) {
        console.error('Error in getStockTags controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all stocks with a specific tag
exports.getStocksWithTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        
        // Check if tag exists
        const tag = await TagRepo.getTagById(tagId);
        if (!tag) {
            return res.status(404).json({ message: `Tag with ID ${tagId} not found` });
        }
        
        // Get stocks with tag
        const stocks = await TagRepo.getStocksWithTag(tagId);
        res.status(200).json(stocks);
    } catch (error) {
        console.error('Error in getStocksWithTag controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get filtered and sorted tags
exports.getFilteredAndSortedTags = async (req, res) => {
    try {
        const { category, sortBy } = req.query;
        
        // Get filtered and sorted tags
        const tags = await TagRepo.getFilteredAndSortedTags(category, sortBy);
        res.status(200).json(tags);
    } catch (error) {
        console.error('Error in getFilteredAndSortedTags controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 