class Portfolio {
    constructor(
        id = null,
        userId,
        stockName,
        quantity = 0,
        purchasePrice = 0,
        purchaseDate = new Date(),
        notes = ''
    ) {
        this.id = id;
        this.userId = userId;
        this.stockName = stockName;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.purchaseDate = purchaseDate;
        this.notes = notes;
    }
}

module.exports = Portfolio; 