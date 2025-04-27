import { faker } from "@faker-js/faker";
import Stock from "../classes/Stock";
import StockRepo from "../classes/StockRepo";

export class StockGenerator {
  private static readonly industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Energy",
    "Agriculture",
    "Manufacturing",
    "Consumer Cyclical",
    "Entertainment",
    "Automotive",
  ];

  public static generateLargeStockSet(): StockRepo {
    const stocks: Stock[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < 500; i++) {
      let companyName: string;

      // Ensure unique company names
      do {
        companyName = faker.company.name().replace(/[.,]/g, "");
      } while (usedNames.has(companyName));

      usedNames.add(companyName);

      // Create the stock with initial amount_owned of 0
      const stock = new Stock(
        companyName,
        this.randomNumber(1, 5000), // price: $1 to $5000
        0, // initial amount_owned
        this.randomNumber(-50, 100), // change: -50% to +100%
        "src/assets/company_default.png",
        faker.number.int({ min: 1000000, max: 3000000000000 }), // marketCap: $1M to $3T
        this.randomNumber(0, 10), // dividendAmount: 0 to 10
        faker.helpers.arrayElement(this.industries),
        // Location: City, State/Country
        `${faker.location.city()}, ${faker.location.state()}`,
        this.randomNumber(5, 100), // peRatio: 5 to 100
      );

      // Set a random amount_owned after creation
      const randomAmount = this.randomNumber(0, 1000);
      stock.updateAmount(randomAmount);

      stocks.push(stock);
    }

    // Create statistics about the generated data
    const stats = {
      totalStocks: stocks.length,
      industriesDistribution: stocks.reduce(
        (acc, stock) => {
          acc[stock.industry] = (acc[stock.industry] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      averagePrice:
        stocks.reduce((sum, stock) => sum + stock.price, 0) / stocks.length,
      averageMarketCap:
        stocks.reduce((sum, stock) => sum + stock.marketCap, 0) / stocks.length,
      totalCompaniesWithDividends: stocks.filter(
        (stock) => stock.dividendAmount > 0,
      ).length,
    };

    // Log statistics to console for verification
    console.log("Generated Stock Statistics:", stats);

    return new StockRepo(stocks);
  }

  public static addGeneratedStocksToRepo(existingRepo: StockRepo): StockRepo {
    const generatedStocks = this.generateLargeStockSet();
    let updatedRepo = new StockRepo([...existingRepo.getStocks()]);

    // Add all generated stocks to the existing repo
    generatedStocks.getStocks().forEach((stock) => {
      updatedRepo = updatedRepo.addStock(stock);
    });

    return updatedRepo;
  }

  /**
   * Generates a single realistic stock entity
   * @returns A new Stock instance with realistic data
   */
  public static generateSingleStock(): Stock {
    const stock = new Stock(
      faker.company.name().replace(/[.,]/g, ""),
      this.randomNumber(1, 5000), // price
      0, // initial amount_owned
      this.randomNumber(-50, 100), // change
      "src/assets/company_default.png",
      faker.number.int({ min: 1000000, max: 3000000000000 }), // marketCap
      this.randomNumber(0, 10), // dividendAmount
      faker.helpers.arrayElement(this.industries),
      `${faker.location.city()}, ${faker.location.state()}`,
      this.randomNumber(5, 100), // peRatio
    );

    // Set a random amount_owned after creation
    const randomAmount = this.randomNumber(0, 1000);
    stock.updateAmount(randomAmount);

    return stock;
  }

  /**
   * Generates a set of random stocks with the specified count
   * @param count Number of stocks to generate
   * @returns Array of generated Stock instances
   */
  public static generateRandomStocks(count: number): Stock[] {
    const stocks: Stock[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
      let companyName: string;

      // Ensure unique company names
      do {
        companyName = faker.company.name().replace(/[.,]/g, "");
      } while (usedNames.has(companyName));

      usedNames.add(companyName);

      // Create the stock with initial amount_owned of 0
      const stock = new Stock(
        companyName,
        this.randomNumber(1, 5000), // price: $1 to $5000
        0, // initial amount_owned
        this.randomNumber(-50, 100), // change: -50% to +100%
        "src/assets/company_default.png",
        faker.number.int({ min: 1000000, max: 3000000000000 }), // marketCap: $1M to $3T
        this.randomNumber(0, 10), // dividendAmount: 0 to 10
        faker.helpers.arrayElement(this.industries),
        // Location: City, State/Country
        `${faker.location.city()}, ${faker.location.state()}`,
        this.randomNumber(5, 100), // peRatio: 5 to 100
      );

      // Set a random amount_owned after creation
      const randomAmount = this.randomNumber(0, 1000);
      stock.updateAmount(randomAmount);

      stocks.push(stock);
    }

    return stocks;
  }

  private static randomNumber(
    min: number,
    max: number,
    decimals: number = 2,
  ): number {
    const num = Math.random() * (max - min) + min;
    return Number(num.toFixed(decimals));
  }
}
