const request = require('supertest');
const express = require('express');
const stockRoutes = require('../routes/stockRoutes');
const stockController = require('../controllers/stockController');
const StockRepo = require('../models/StockRepo');

// Mock the StockRepo methods
jest.mock('../models/StockRepo', () => {
    return {
        initialize: jest.fn().mockResolvedValue(true),
        getAllStocks: jest.fn(),
        getStockByName: jest.fn(),
        getStocksByIndustry: jest.fn(),
        getStocksByPriceRange: jest.fn(),
        addStock: jest.fn(),
        updateStock: jest.fn(),
        deleteStock: jest.fn(),
        stockExists: jest.fn()
    };
});

const app = express();
app.use(express.json());
app.use('/api/stocks', stockRoutes);

describe('Stock API Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test GET all stocks
    describe('GET /api/stocks', () => {
        it('should return all stocks', async () => {
            const mockStocks = [
                { name: 'Apple', price: 193 },
                { name: 'Tesla', price: 177 }
            ];
            
            StockRepo.getAllStocks.mockResolvedValue(mockStocks);
            
            const res = await request(app).get('/api/stocks');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockStocks);
            expect(StockRepo.getAllStocks).toHaveBeenCalledTimes(1);
        });
        
        it('should handle errors and return 500', async () => {
            StockRepo.getAllStocks.mockRejectedValue(new Error('Database error'));
            
            const res = await request(app).get('/api/stocks');
            
            expect(res.statusCode).toEqual(500);
            expect(res.body.message).toEqual('Server error');
        });
    });

    // Test GET stock by name
    describe('GET /api/stocks/:name', () => {
        it('should return a stock by name', async () => {
            const mockStock = { name: 'Apple', price: 193 };
            
            StockRepo.getStockByName.mockResolvedValue(mockStock);
            
            const res = await request(app).get('/api/stocks/Apple');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockStock);
            expect(StockRepo.getStockByName).toHaveBeenCalledWith('Apple');
        });
        
        it('should return 404 if stock not found', async () => {
            StockRepo.getStockByName.mockResolvedValue(null);
            
            const res = await request(app).get('/api/stocks/NonExistentStock');
            
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Stock \'NonExistentStock\' not found');
        });
    });

    // Test POST create stock
    describe('POST /api/stocks', () => {
        it('should create a new stock', async () => {
            const newStock = {
                name: 'Google',
                price: 168,
                industry: 'Technology'
            };
            
            StockRepo.stockExists.mockResolvedValue(false);
            StockRepo.addStock.mockResolvedValue({ id: 1, ...newStock });
            
            const res = await request(app)
                .post('/api/stocks')
                .send(newStock);
            
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toEqual('Google');
            expect(StockRepo.addStock).toHaveBeenCalledWith(newStock);
        });
        
        it('should return 409 if stock already exists', async () => {
            const existingStock = {
                name: 'Apple',
                price: 193
            };
            
            StockRepo.stockExists.mockResolvedValue(true);
            
            const res = await request(app)
                .post('/api/stocks')
                .send(existingStock);
            
            expect(res.statusCode).toEqual(409);
            expect(res.body.message).toEqual('Stock \'Apple\' already exists');
            expect(StockRepo.addStock).not.toHaveBeenCalled();
        });
        
        it('should return 400 if validation fails', async () => {
            const invalidStock = {
                name: 'InvalidStock',
                price: -10 // Negative price should fail validation
            };
            
            const res = await request(app)
                .post('/api/stocks')
                .send(invalidStock);
            
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toEqual('Validation failed');
        });
    });

    // Test PATCH update stock
    describe('PATCH /api/stocks/:name', () => {
        it('should update an existing stock', async () => {
            const stockUpdate = {
                price: 200,
                change: 5
            };
            
            const updatedStock = {
                name: 'Apple',
                price: 200,
                change: 5
            };
            
            StockRepo.stockExists.mockResolvedValue(true);
            StockRepo.updateStock.mockResolvedValue(updatedStock);
            
            const res = await request(app)
                .patch('/api/stocks/Apple')
                .send(stockUpdate);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(updatedStock);
            expect(StockRepo.updateStock).toHaveBeenCalledWith('Apple', stockUpdate);
        });
        
        it('should return 404 if stock to update not found', async () => {
            StockRepo.stockExists.mockResolvedValue(false);
            
            const res = await request(app)
                .patch('/api/stocks/NonExistentStock')
                .send({ price: 200 });
            
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Stock \'NonExistentStock\' not found');
        });
    });

    // Test DELETE stock
    describe('DELETE /api/stocks/:name', () => {
        it('should delete an existing stock', async () => {
            const deletedStock = {
                name: 'Apple',
                price: 193
            };
            
            StockRepo.stockExists.mockResolvedValue(true);
            StockRepo.deleteStock.mockResolvedValue(deletedStock);
            
            const res = await request(app).delete('/api/stocks/Apple');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('Stock \'Apple\' deleted successfully');
            expect(res.body.deletedStock).toEqual(deletedStock);
            expect(StockRepo.deleteStock).toHaveBeenCalledWith('Apple');
        });
        
        it('should return 404 if stock to delete not found', async () => {
            StockRepo.stockExists.mockResolvedValue(false);
            
            const res = await request(app).delete('/api/stocks/NonExistentStock');
            
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Stock \'NonExistentStock\' not found');
        });
    });

    // Test filter by industry
    describe('GET /api/stocks/filter/industry/:industry', () => {
        it('should return stocks filtered by industry', async () => {
            const techStocks = [
                { name: 'Apple', price: 193, industry: 'Technology' },
                { name: 'Google', price: 168, industry: 'Technology' }
            ];
            
            StockRepo.getStocksByIndustry.mockResolvedValue(techStocks);
            
            const res = await request(app).get('/api/stocks/filter/industry/Technology');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(techStocks);
            expect(StockRepo.getStocksByIndustry).toHaveBeenCalledWith('Technology');
        });
    });

    // Test filter by price range
    describe('GET /api/stocks/filter/price', () => {
        it('should return stocks filtered by price range', async () => {
            const filteredStocks = [
                { name: 'Apple', price: 193 },
                { name: 'Google', price: 168 }
            ];
            
            StockRepo.getStocksByPriceRange.mockResolvedValue(filteredStocks);
            
            const res = await request(app).get('/api/stocks/filter/price?min=150&max=200');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(filteredStocks);
            expect(StockRepo.getStocksByPriceRange).toHaveBeenCalledWith('150', '200');
        });
        
        it('should handle invalid price parameters', async () => {
            const res = await request(app).get('/api/stocks/filter/price?min=abc&max=def');
            
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toEqual('Min and max must be numbers');
        });
    });
}); 