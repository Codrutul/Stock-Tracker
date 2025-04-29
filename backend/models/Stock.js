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
        
        // Sanitize numeric values
        this.price = this.sanitizeNumeric(price);
        this.amount_owned = this.sanitizeNumeric(amount_owned);
        this.change = this.sanitizeNumeric(change);
        this.marketCap = this.sanitizeNumeric(marketCap);
        this.dividendAmount = this.sanitizeNumeric(dividendAmount);
        this.peRatio = this.sanitizeNumeric(peRatio);
        
        // Non-numeric values
        this.image_src = image_src;
        this.industry = industry;
        this.headquarters = headquarters;
    }
    
    // Helper method to ensure numeric values are valid
    sanitizeNumeric(value) {
        // Convert to number if it's a string
        if (typeof value === 'string') {
            value = parseFloat(value);
        }
        
        // Handle NaN or undefined
        if (isNaN(value) || value === undefined) {
            return 0;
        }
        
        // Round to 2 decimal places to avoid precision errors
        return parseFloat(value.toFixed(2));
    }
}

module.exports = Stock; 