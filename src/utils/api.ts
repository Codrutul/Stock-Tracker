import Stock from '../classes/Stock';
import { faker } from '@faker-js/faker';

const API_URL = 'http://localhost:5001/api';

// Interface for stock data from API
interface StockDTO {
    name: string;
    price: number;
    amount_owned: number;
    change: number;
    image_src?: string;
    marketCap: number;
    dividendAmount: number;
    industry: string;
    headquarters: string;
    peRatio: number;
}

const validIndustries = [
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

/**
 * API client for interacting with the backend
 */
export const stockApi = {
    /**
     * Log API request details
     */
    _logRequest: (method: string, url: string, body?: any) => {
        console.log(`📡 API REQUEST: ${method.toUpperCase()} ${url}`);
        if (body) {
            console.log('📦 Request Payload:', JSON.stringify(body, null, 2));
        }
        return { startTime: Date.now() };
    },

    /**
     * Log API response details
     */
    _logResponse: (startTime: number, response: Response, data: any) => {
        const duration = Date.now() - startTime;
        console.log(`📡 API RESPONSE: ${response.status} ${response.statusText} [${duration}ms]`);
        
        if (data) {
            if (Array.isArray(data)) {
                console.log(`📊 Received array with ${data.length} items`);
                if (data.length > 0) {
                    console.log('📋 First item sample:', JSON.stringify(data[0], null, 2).substring(0, 200));
                }
            } else {
                console.log('📋 Response Data:', JSON.stringify(data, null, 2).substring(0, 500) + (JSON.stringify(data).length > 500 ? '...' : ''));
            }
        }
        return data;
    },

    /**
     * Get all stocks from the API
     */
    getAllStocks: async (): Promise<Stock[]> => {
        const url = `${API_URL}/stocks`;
        const reqLog = stockApi._logRequest('GET', url);
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            stockApi._logResponse(reqLog.startTime, response, data);
            
            return data.map((stock: StockDTO) => new Stock(
                stock.name,
                stock.price,
                stock.amount_owned,
                stock.change,
                stock.image_src,
                stock.marketCap,
                stock.dividendAmount,
                stock.industry,
                stock.headquarters,
                stock.peRatio
            ));
        } catch (error) {
            console.error('❌ Error fetching stocks:', error);
            throw error;
        }
    },

    /**
     * Get a single stock by name
     */
    getStockByName: async (name: string): Promise<Stock | null> => {
        try {
            const response = await fetch(`${API_URL}/stocks/${name}`);
            if (response.status === 404) {
                return null;
            }
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return new Stock(
                data.name,
                data.price,
                data.amount_owned,
                data.change,
                data.image_src,
                data.marketCap,
                data.dividendAmount,
                data.industry,
                data.headquarters,
                data.peRatio
            );
        } catch (error) {
            console.error(`Error fetching stock ${name}:`, error);
            throw error;
        }
    },

    /**
     * Create a new stock
     */
    createStock: async (stock: Stock): Promise<Stock> => {
        try {
            // Prepare stock data to ensure all required fields are present
            const stockData = {
                name: stock.name,
                price: faker.number.int({ min: 1, max: 1000 }), // price: $1 to $1000
                amount_owned: 0,
                change: faker.number.int({ min: -99, max: 100 }),
                image_src: faker.image.url(),
                marketCap: faker.number.int({ min: 1000000, max: 3000000000000 }),
                dividendAmount: faker.number.float({ min: 0, max: 10 }),
                industry: validIndustries[Math.floor(Math.random() * validIndustries.length)],
                headquarters: faker.location.city(),
                peRatio: faker.number.float({ min: 0, max: 10 }),
            };
            
            const url = `${API_URL}/stocks`;
            const reqLog = stockApi._logRequest('POST', url, stockData);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(stockData),
            });
            
            if (!response.ok) {
                let errorMessage = `Error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('❌ API Error:', errorData);
                } catch (e) {
                    // If response is not JSON, use the status text
                    errorMessage = response.statusText || errorMessage;
                    console.error('❌ API Error (non-JSON):', errorMessage);
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            stockApi._logResponse(reqLog.startTime, response, data);
            
            return new Stock(
                data.name,
                data.price,
                data.amount_owned,
                data.change,
                data.image_src,
                data.marketCap,
                data.dividendAmount,
                data.industry,
                data.headquarters,
                data.peRatio
            );
        } catch (error) {
            console.error('❌ API Error in createStock:', error);
            throw error;
        }
    },

    /**
     * Update an existing stock
     */
    updateStock: async (name: string, stock: Partial<Stock>): Promise<Stock> => {
        try {
            const response = await fetch(`${API_URL}/stocks/${name}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(stock),
            });
            
            if (!response.ok) {
                let errorMessage = `Error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use the status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            return new Stock(
                data.name,
                data.price,
                data.amount_owned,
                data.change,
                data.image_src,
                data.marketCap,
                data.dividendAmount,
                data.industry,
                data.headquarters,
                data.peRatio
            );
        } catch (error) {
            console.error(`Error updating stock ${name}:`, error);
            throw error;
        }
    },

    /**
     * Delete a stock
     */
    deleteStock: async (name: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/stocks/${name}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                let errorMessage = `Error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use the status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            return true;
        } catch (error) {
            console.error(`Error deleting stock ${name}:`, error);
            throw error;
        }
    },

    /**
     * Get stocks filtered by industry
     */
    getStocksByIndustry: async (industry: string): Promise<Stock[]> => {
        try {
            const response = await fetch(`${API_URL}/stocks/filter/industry/${industry}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return data.map((stock: StockDTO) => new Stock(
                stock.name,
                stock.price,
                stock.amount_owned,
                stock.change,
                stock.image_src,
                stock.marketCap,
                stock.dividendAmount,
                stock.industry,
                stock.headquarters,
                stock.peRatio
            ));
        } catch (error) {
            console.error(`Error fetching stocks by industry ${industry}:`, error);
            throw error;
        }
    },

    /**
     * Get stocks filtered by price range
     */
    getStocksByPriceRange: async (min: number, max: number): Promise<Stock[]> => {
        try {
            const response = await fetch(`${API_URL}/stocks/filter/price?min=${min}&max=${max}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return data.map((stock: StockDTO) => new Stock(
                stock.name,
                stock.price,
                stock.amount_owned,
                stock.change,
                stock.image_src,
                stock.marketCap,
                stock.dividendAmount,
                stock.industry,
                stock.headquarters,
                stock.peRatio
            ));
        } catch (error) {
            console.error(`Error fetching stocks by price range:`, error);
            throw error;
        }
    },

    /**
     * Get sorted stocks
     */
    getSortedStocks: async (sortBy: string): Promise<Stock[]> => {
        try {
            const response = await fetch(`${API_URL}/stocks/sort/${sortBy}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return data.map((stock: StockDTO) => new Stock(
                stock.name,
                stock.price,
                stock.amount_owned,
                stock.change,
                stock.image_src,
                stock.marketCap,
                stock.dividendAmount,
                stock.industry,
                stock.headquarters,
                stock.peRatio
            ));
        } catch (error) {
            console.error(`Error fetching sorted stocks:`, error);
            throw error;
        }
    },

    /**
     * Update just the amount owned for a stock
     */
    updateStockAmount: async (name: string, amount: number): Promise<Stock> => {
        try {
            console.log(`🔄 API - Updating amount for stock ${name} to ${amount}`);
            
            const response = await fetch(`${API_URL}/stocks/${name}/amount`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount_owned: amount }),
            });
            
            console.log(`📥 Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                let errorMessage = `Error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('❌ API Error:', errorData);
                } catch (e) {
                    // If response is not JSON, use the status text
                    errorMessage = response.statusText || errorMessage;
                    console.error('❌ API Error (non-JSON):', errorMessage);
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('✅ API - Stock amount updated successfully:', data);
            
            return new Stock(
                data.name,
                data.price,
                data.amount_owned,
                data.change,
                data.image_src,
                data.marketCap,
                data.dividendAmount,
                data.industry,
                data.headquarters,
                data.peRatio
            );
        } catch (error) {
            console.error(`❌ Error updating amount for stock ${name}:`, error);
            throw error;
        }
    },

    /**
     * Get filtered and sorted stocks in one request
     */
    getFilteredAndSortedStocks: async (
        industry: string, 
        priceMin: number, 
        priceMax: number, 
        sortBy: string
    ): Promise<Stock[]> => {
        try {
            console.log(`🔍 API - Getting filtered and sorted stocks: industry=${industry}, price=${priceMin}-${priceMax}, sortBy=${sortBy}`);
            
            // Convert sort option from UI to backend format
            let sortParam = '';
            switch (sortBy) {
                case 'Stock Price':
                    sortParam = 'price';
                    break;
                case 'Company Market Cap':
                    sortParam = 'marketCap';
                    break;
                case 'Growth in the last month':
                    sortParam = 'change';
                    break;
                case 'Dividend amount':
                    sortParam = 'dividendAmount';
                    break;
                case 'Amount owned':
                    sortParam = 'amount_owned';
                    break;
                default:
                    sortParam = 'name';
            }
            
            // Build query string
            const params = new URLSearchParams();
            if (industry && industry !== 'All') params.append('industry', industry);
            params.append('min', priceMin.toString());
            params.append('max', priceMax.toString());
            params.append('sortBy', sortParam);
            
            const url = `${API_URL}/stocks/filteredAndSorted?${params.toString()}`;
            console.log(`📡 Sending GET request to ${url}`);
            
            const response = await fetch(url);
            
            console.log(`📥 Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                let errorMessage = `Error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('❌ API Error:', errorData);
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                    console.error('❌ API Error (non-JSON):', errorMessage);
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log(`✅ API - Received ${data.length} filtered and sorted stocks`);
            
            return data.map((stock: StockDTO) => new Stock(
                stock.name,
                stock.price,
                stock.amount_owned,
                stock.change,
                stock.image_src,
                stock.marketCap,
                stock.dividendAmount,
                stock.industry,
                stock.headquarters,
                stock.peRatio
            ));
        } catch (error) {
            console.error('❌ Error fetching filtered and sorted stocks:', error);
            throw error;
        }
    },

    /**
     * Ping the server to check if it is up
     */
    pingServer: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}; 