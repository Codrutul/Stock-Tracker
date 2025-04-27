class Stock {
    constructor(
        name, 
        price = 0, 
        amount_owned = 0, 
        change = 0, 
        image_src = "",
        marketCap = 0,
        dividendAmount = 0,
        industry = "",
        headquarters = "",
        peRatio = 0
    ) {
        this.name = name;
        this.price = price;
        this.image_src = image_src;
        this.amount_owned = amount_owned;
        this.change = change;
        this.marketCap = marketCap;
        this.dividendAmount = dividendAmount;
        this.industry = industry;
        this.headquarters = headquarters;
        this.peRatio = peRatio;
    }
}

module.exports = Stock; 