import StockRepo from "./classes/StockRepo";
import Stock from "./classes/Stock";
import "@testing-library/jest-dom";

describe("Stock Filtering and Sorting Tests", () => {
  // Test data
  const testStocks = [
    new Stock(
      "Apple",
      193,
      10,
      -5,
      "",
      2930000000000,
      0.96,
      "Technology",
      "Cupertino, CA",
      30.12,
    ),
    new Stock(
      "Tesla",
      177,
      20,
      -20,
      "",
      565000000000,
      0,
      "Automotive",
      "Austin, TX",
      62.18,
    ),
    new Stock(
      "Microsoft",
      406,
      5,
      5,
      "",
      3050000000000,
      2.72,
      "Technology",
      "Redmond, WA",
      36.94,
    ),
    new Stock(
      "Ford",
      12.04,
      15,
      -15,
      "",
      47900000000,
      0.6,
      "Automotive",
      "Dearborn, MI",
      12.04,
    ),
  ];

  const sortStocks = (stocks: Stock[], sortOption: string): Stock[] => {
    const stocksCopy = [...stocks];

    switch (sortOption) {
      case "Stock Price":
        return stocksCopy.sort((a, b) => b.price - a.price);
      case "Company Market Cap":
        return stocksCopy.sort((a, b) => b.marketCap - a.marketCap);
      case "Growth in the last month":
        return stocksCopy.sort((a, b) => b.change - a.change);
      case "Dividend amount":
        return stocksCopy.sort((a, b) => b.dividendAmount - a.dividendAmount);
      case "Amount owned":
        return stocksCopy.sort((a, b) => b.amount_owned - a.amount_owned);
      default:
        return stocksCopy;
    }
  };

  const getFilteredAndSortedStocks = (
    stocks: Stock[],
    filterValue: string,
    sortOption: string,
    priceRange: { min: number; max: number },
  ): Stock[] => {
    let filteredStocks: Stock[];

    // First filter by industry
    if (filterValue === "All") {
      filteredStocks = stocks;
    } else {
      filteredStocks = stocks.filter((stock) => stock.industry === filterValue);
    }

    // Then filter by price range
    filteredStocks = filteredStocks.filter(
      (stock) => stock.price >= priceRange.min && stock.price <= priceRange.max,
    );

    // Finally sort
    return sortStocks(filteredStocks, sortOption);
  };

  describe("Combined Filtering and Sorting", () => {
    test("filters by industry and price range, then sorts by price", () => {
      const result = getFilteredAndSortedStocks(
        testStocks,
        "Technology",
        "Stock Price",
        { min: 0, max: 1000 },
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Microsoft"); // Highest price tech stock
      expect(result[1].name).toBe("Apple"); // Second highest price tech stock
    });

    test("filters by price range only", () => {
      const result = getFilteredAndSortedStocks(
        testStocks,
        "All",
        "Stock Price",
        { min: 100, max: 200 },
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Apple"); // Higher price in range
      expect(result[1].name).toBe("Tesla"); // Lower price in range
    });

    test("handles empty results correctly", () => {
      const result = getFilteredAndSortedStocks(
        testStocks,
        "NonExistent",
        "Stock Price",
        { min: 0, max: 1000 },
      );
      expect(result).toHaveLength(0);
    });

    test("handles extreme price ranges", () => {
      const result = getFilteredAndSortedStocks(
        testStocks,
        "All",
        "Stock Price",
        { min: 1000, max: 2000 },
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("Stock Repository Basic Operations", () => {
    test("adds and removes stocks correctly", () => {
      const repo = new StockRepo([]);

      // Test adding
      const newStock = new Stock(
        "Netflix",
        628.38,
        0,
        30,
        "",
        271000000000,
        0,
        "Entertainment",
        "Los Gatos, CA",
        50.68,
      );
      let updatedRepo = repo.addStock(newStock);
      expect(updatedRepo.getStocks()).toHaveLength(1);
      expect(updatedRepo.getStocks()[0].name).toBe("Netflix");

      // Test removing
      updatedRepo = updatedRepo.removeStock(newStock);
      expect(updatedRepo.getStocks()).toHaveLength(0);
    });

    test("verifies stock existence", () => {
      const repo = new StockRepo(testStocks);
      expect(repo.verifyStock("Apple")).toBeTruthy();
      expect(repo.verifyStock("NonExistent")).toBeFalsy();
    });

    test("gets stocks by industry", () => {
      const repo = new StockRepo(testStocks);
      const techStocks = repo.getStocksByIndustry("Technology");
      expect(techStocks).toHaveLength(2);
      expect(techStocks.map((s) => s.name)).toContain("Apple");
      expect(techStocks.map((s) => s.name)).toContain("Microsoft");
    });

    test("gets stocks by price range", () => {
      const repo = new StockRepo(testStocks);
      const stocks = repo.getStocksPriceRange(100, 200);
      expect(stocks).toHaveLength(2);
      expect(stocks.map((s) => s.name)).toContain("Apple");
      expect(stocks.map((s) => s.name)).toContain("Tesla");
    });
  });
});
