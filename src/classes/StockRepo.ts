import Stock from './Stock'
import { stockApi } from '../utils/api'

export default class StockRepo {
    list: Stock[] = []

    constructor(list: Stock[] = []) {
        this.list = list
    }

    addStock(stock: Stock | undefined) {
        if (!stock) {
            return this;
        }
        const newList = [...this.list, stock];
        return new StockRepo(newList);
    }

    appendStock(stock: Stock | undefined) {
        if (stock)
            this.list.push(stock);
    }

    removeStock(stock: Stock) {
        const newList = this.list.filter((s) => s !== stock);
        return new StockRepo(newList);
    }

    updateStock(updatedStock: Stock) {
        const index = this.list.findIndex(stock => stock.name === updatedStock.name);
        if (index !== -1) {
            this.list[index] = updatedStock;
        }
        return this;
    }

    getStocks() {
        return this.list
    }

    getStock(name: string) {
        return this.list.find(s => s.name === name)
    }

    verifyStock(name: string) {
        return this.list.some(s => s.name === name)
    }

    // Note: These methods now fetch from the backend API
    // They are kept for backward compatibility, but in most cases
    // you should use stockApi directly for server operations
    async getStocksByIndustry(industry: string): Promise<Stock[]> {
        try {
            // Use API to get industry-filtered stocks
            return await stockApi.getStocksByIndustry(industry);
        } catch (error) {
            console.error(`Error fetching stocks by industry: ${error}`);
            // Fallback to local filtering if API fails
            if (industry === "All") {
                return this.list;
            }
            return this.list.filter(s => s.industry === industry);
        }
    }

    async getStocksPriceRange(min: number, max: number): Promise<Stock[]> {
        try {
            // Use API to get price-filtered stocks
            return await stockApi.getStocksByPriceRange(min, max);
        } catch (error) {
            console.error(`Error fetching stocks by price range: ${error}`);
            // Fallback to local filtering if API fails
            return this.list.filter(s => s.price >= min && s.price <= max);
        }
    }

    async getFilteredAndSortedStocks(
        industry: string,
        minPrice: number,
        maxPrice: number,
        sortOption: string
    ): Promise<Stock[]> {
        try {
            // Use the API to get filtered and sorted stocks
            return await stockApi.getFilteredAndSortedStocks(
                industry,
                minPrice,
                maxPrice,
                sortOption
            );
        } catch (error) {
            console.error(`Error fetching filtered and sorted stocks: ${error}`);
            // If the API call fails, fallback to local filtering and sorting
            let filteredStocks = this.list;
            
            // Apply industry filter
            if (industry !== "All") {
                filteredStocks = filteredStocks.filter(s => s.industry === industry);
            }
            
            // Apply price filter
            filteredStocks = filteredStocks.filter(s => s.price >= minPrice && s.price <= maxPrice);
            
            // Apply sorting
            switch (sortOption) {
                case "Stock Price":
                    filteredStocks.sort((a, b) => b.price - a.price);
                    break;
                case "Company Market Cap":
                    filteredStocks.sort((a, b) => b.marketCap - a.marketCap);
                    break;
                case "Growth in the last month":
                    filteredStocks.sort((a, b) => b.change - a.change);
                    break;
                case "Dividend amount":
                    filteredStocks.sort((a, b) => b.dividendAmount - a.dividendAmount);
                    break;
                case "Amount owned":
                    filteredStocks.sort((a, b) => b.amount_owned - a.amount_owned);
                    break;
                default:
                    filteredStocks.sort((a, b) => a.name.localeCompare(b.name));
            }
            
            return filteredStocks;
        }
    }
}

// Initialize an empty stock database
// In production, stocks should be loaded from the API
const stockDataBase = new StockRepo()

export {stockDataBase}

// NOTE: The following commented code was used to initialize stockDataBase with sample data.
// It is kept for reference, but in the current implementation, all stock data should come from the backend API.
/*
// Technology Companies
stockDataBase.appendStock(new Stock(
    "Apple",
    193,
    0,
    -5,
    "src/assets/apple.png",
    2930000000000, // Market cap: $2.93T
    0.96, // Dividend: $0.96
    "Technology",
    "Cupertino, CA",
    30.12 // P/E ratio
))

// More stock data was here...
*/

