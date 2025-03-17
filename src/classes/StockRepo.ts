import Stock from './Stock'

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

    getStocks() {
        return this.list
    }

    getStock(name: string) {
        return this.list.find(s => s.name === name)
    }

    verifyStock(name: string) {
        return this.list.some(s => s.name === name)
    }

    getStocksByIndustry(industry: string) {
        if (industry === "All") {
            return this.list;
        }
        return this.list.filter(s => s.industry === industry);
    }
}

const stockDataBase = new StockRepo()

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

stockDataBase.appendStock(new Stock(
    "Microsoft", 
    406, 
    0, 
    5, 
    "src/assets/microsoft.png",
    3050000000000, // Market cap: $3.05T
    2.72, // Dividend: $2.72
    "Technology",
    "Redmond, WA",
    36.94 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Google", 
    168, 
    0, 
    10, 
    "src/assets/google.png",
    2080000000000, // Market cap: $2.08T
    0, // No dividend
    "Technology",
    "Mountain View, CA",
    27.16 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Meta", 
    489, 
    0, 
    15, 
    "src/assets/meta.png",
    1250000000000, // Market cap: $1.25T
    0, // No dividend
    "Technology",
    "Menlo Park, CA",
    33.17 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "NVIDIA", 
    878, 
    0, 
    12, 
    "src/assets/nvidia.png",
    2160000000000, // Market cap: $2.16T
    0.16, // Dividend: $0.16
    "Technology",
    "Santa Clara, CA",
    72.58 // P/E ratio
))

// Automotive Companies
stockDataBase.appendStock(new Stock(
    "Tesla", 
    177, 
    0, 
    -20, 
    "src/assets/tesla.png",
    565000000000, // Market cap: $565B
    0, // No dividend
    "Automotive",
    "Austin, TX",
    62.18 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Ford", 
    12.04, 
    0, 
    -15, 
    "src/assets/ford.png",
    47900000000, // Market cap: $47.9B
    0.60, // Dividend: $0.60
    "Automotive",
    "Dearborn, MI",
    12.04 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "GM", 
    44.38, 
    0, 
    -8, 
    "src/assets/gm.png",
    51200000000, // Market cap: $51.2B
    0.48, // Dividend: $0.48
    "Automotive",
    "Detroit, MI",
    5.98 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Toyota", 
    189.71, 
    0, 
    3, 
    "src/assets/toyota.png",
    258000000000, // Market cap: $258B
    2.80, // Dividend: $2.80
    "Automotive",
    "Toyota City, Japan",
    10.42 // P/E ratio
))

// Finance Companies
stockDataBase.appendStock(new Stock(
    "JPMorgan", 
    199.95, 
    0, 
    8, 
    "src/assets/jpmorgan.png",
    574000000000, // Market cap: $574B
    4.00, // Dividend: $4.00
    "Finance",
    "New York, NY",
    12.11 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Bank of America", 
    38.24, 
    0, 
    2, 
    "src/assets/bofa.png",
    302000000000, // Market cap: $302B
    0.96, // Dividend: $0.96
    "Finance",
    "Charlotte, NC",
    12.55 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Visa", 
    275.93, 
    0, 
    4, 
    "src/assets/visa.png",
    555000000000, // Market cap: $555B
    2.08, // Dividend: $2.08
    "Finance",
    "San Francisco, CA",
    30.91 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "PayPal", 
    62.30, 
    0, 
    -12, 
    "src/assets/paypal.png",
    66100000000, // Market cap: $66.1B
    0, // No dividend
    "Finance",
    "San Jose, CA",
    17.12 // P/E ratio
))

// Healthcare Companies
stockDataBase.appendStock(new Stock(
    "Johnson & Johnson", 
    147.52, 
    0, 
    -10, 
    "src/assets/jnj.png",
    356000000000, // Market cap: $356B
    4.76, // Dividend: $4.76
    "Healthcare",
    "New Brunswick, NJ",
    25.13 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Pfizer", 
    28.79, 
    0, 
    -25, 
    "src/assets/pfizer.png",
    163000000000, // Market cap: $163B
    1.64, // Dividend: $1.64
    "Healthcare",
    "New York, NY",
    45.70 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "UnitedHealth", 
    528.56, 
    0, 
    7, 
    "src/assets/unitedhealth.png",
    478000000000, // Market cap: $478B
    7.52, // Dividend: $7.52
    "Healthcare",
    "Minnetonka, MN",
    22.18 // P/E ratio
))

// Energy Companies
stockDataBase.appendStock(new Stock(
    "ExxonMobil", 
    119.92, 
    0, 
    2, 
    "src/assets/exxon.png",
    474000000000, // Market cap: $474B
    3.80, // Dividend: $3.80
    "Energy",
    "Irving, TX",
    14.65 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Chevron", 
    154.66, 
    0, 
    -5, 
    "src/assets/chevron.png",
    286000000000, // Market cap: $286B
    6.04, // Dividend: $6.04
    "Energy",
    "San Ramon, CA",
    13.45 // P/E ratio
))

// Consumer Cyclical
stockDataBase.appendStock(new Stock(
    "Amazon", 
    178.15, 
    0, 
    25, 
    "src/assets/amazon.png",
    1860000000000, // Market cap: $1.86T
    0, // No dividend
    "Consumer Cyclical",
    "Seattle, WA",
    43.21 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Walmart", 
    60.46, 
    0, 
    10, 
    "src/assets/walmart.png",
    488000000000, // Market cap: $488B
    0.88, // Dividend: $0.88
    "Consumer Cyclical",
    "Bentonville, AR",
    25.73 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Home Depot", 
    342.87, 
    0, 
    5, 
    "src/assets/homedepot.png",
    339000000000, // Market cap: $339B
    9.24, // Dividend: $9.24
    "Consumer Cyclical",
    "Atlanta, GA",
    23.14 // P/E ratio
))

// Entertainment
stockDataBase.appendStock(new Stock(
    "Netflix", 
    628.38, 
    0, 
    30, 
    "src/assets/netflix.png",
    271000000000, // Market cap: $271B
    0, // No dividend
    "Entertainment",
    "Los Gatos, CA",
    50.68 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Disney", 
    90.35, 
    0, 
    -8, 
    "src/assets/disney.png",
    165000000000, // Market cap: $165B
    0.80, // Dividend: $0.80
    "Entertainment",
    "Burbank, CA",
    69.50 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Spotify", 
    304.13, 
    0, 
    40, 
    "src/assets/spotify.png",
    60300000000, // Market cap: $60.3B
    0, // No dividend
    "Entertainment",
    "Stockholm, Sweden",
    162.63 // P/E ratio
))

// Manufacturing
stockDataBase.appendStock(new Stock(
    "Caterpillar", 
    347.30, 
    0, 
    12, 
    "src/assets/caterpillar.png",
    169000000000, // Market cap: $169B
    5.20, // Dividend: $5.20
    "Manufacturing",
    "Deerfield, IL",
    15.70 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "3M", 
    91.94, 
    0, 
    -17, 
    "src/assets/3m.png",
    50800000000, // Market cap: $50.8B
    6.12, // Dividend: $6.12
    "Manufacturing",
    "Saint Paul, MN",
    95.77 // P/E ratio
))

// Agriculture
stockDataBase.appendStock(new Stock(
    "Archer-Daniels-Midland", 
    62.19, 
    0, 
    -3, 
    "src/assets/adm.png",
    31600000000, // Market cap: $31.6B
    1.80, // Dividend: $1.80
    "Agriculture",
    "Chicago, IL",
    10.28 // P/E ratio
))

stockDataBase.appendStock(new Stock(
    "Deere & Company", 
    386.62, 
    0, 
    8, 
    "src/assets/deere.png",
    106000000000, // Market cap: $106B
    5.00, // Dividend: $5.00
    "Agriculture",
    "Moline, IL",
    12.07 // P/E ratio
))

export {stockDataBase}

