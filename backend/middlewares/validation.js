// Middleware for validating stock data
exports.validateStock = (req, res, next) => {
    const stockData = req.body;
    const errors = [];
    
    console.log('Validating stock data:', stockData);

    // Validate required fields
    if (!stockData.name) {
        errors.push('Stock name is required');
    }
    
    // Allow price to be 0 or a positive number
    if (stockData.price === undefined || stockData.price === null) {
        // If price is missing, we'll set a default in the controller
        stockData.price = 0;
    } else if (isNaN(parseFloat(stockData.price))) {
        errors.push('Stock price must be a number');
    } else if (parseFloat(stockData.price) < 0) {
        errors.push('Stock price must be a non-negative number');
    } else {
        // Ensure price is a number type, not string
        stockData.price = parseFloat(stockData.price);
    }
    
    // Validate numeric fields (if provided)
    const numericFields = [
        'amount_owned', 
        'change', 
        'marketCap', 
        'dividendAmount', 
        'peRatio'
    ];
    
    numericFields.forEach(field => {
        if (stockData[field] !== undefined && stockData[field] !== null) {
            // Try to convert to number if it's a string
            const value = typeof stockData[field] === 'string' 
                ? parseFloat(stockData[field]) 
                : stockData[field];
                
            if (isNaN(value)) {
                errors.push(`${field} must be a number`);
            } else {
                // Update the field with the parsed number
                stockData[field] = value;
            }
        } else {
            // Set an explicit 0 for numeric fields to avoid undefined or null issues
            stockData[field] = 0;
        }
    });

    // Check industry is a valid value if provided, but don't make it required
    if (stockData.industry) {
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

        // Case-insensitive check, and normalize to the valid value
        const normalizedIndustry = stockData.industry.trim();
        const matchedIndustry = validIndustries.find(industry =>
            industry.toLowerCase() === normalizedIndustry.toLowerCase()
        );

        if (!matchedIndustry) {
            errors.push(`Industry must be one of: ${validIndustries.join(', ')}`);
        } else {
            // Normalize the industry value to the canonical form
            stockData.industry = matchedIndustry;
        }
    }
    
    if (errors.length > 0) {
        console.log('Validation failed with errors:', errors);
        return res.status(400).json({ 
            message: 'Validation failed', 
            errors 
        });
    }
    
    // Make sure we have defaults for any missing fields
    // Explicitly set to 0 to avoid sending null or undefined values
    if (stockData.amount_owned === undefined || stockData.amount_owned === null) {
        stockData.amount_owned = 0;
    }
    if (stockData.change === undefined || stockData.change === null) {
        stockData.change = 0;
    }
    if (stockData.marketCap === undefined || stockData.marketCap === null) {
        stockData.marketCap = 0;
    }
    if (stockData.dividendAmount === undefined || stockData.dividendAmount === null) {
        stockData.dividendAmount = 0;
    }
    if (!stockData.industry) {
        stockData.industry = 'Technology';
    }
    if (!stockData.headquarters) {
        stockData.headquarters = 'Unknown';
    }
    if (stockData.peRatio === undefined || stockData.peRatio === null) {
        stockData.peRatio = 0;
    }
    
    console.log('Validation passed with data:', stockData);
    next();
};

// Middleware for validating stock amount updates
exports.validateStockAmount = (req, res, next) => {
    const { amount_owned } = req.body;
    const errors = [];
    
    console.log('Validating stock amount update:', req.body);
    
    // Check if amount_owned is present
    if (amount_owned === undefined || amount_owned === null) {
        errors.push('amount_owned is required');
    } else {
        // Try to convert to number if it's a string
        const parsedAmount = typeof amount_owned === 'string'
            ? parseFloat(amount_owned)
            : amount_owned;
            
        if (isNaN(parsedAmount)) {
            errors.push('amount_owned must be a number');
        } else if (parsedAmount < 0) {
            errors.push('amount_owned must be a non-negative number');
        } else {
            // Update the field with the parsed number to ensure it's a number type
            req.body.amount_owned = parsedAmount;
        }
    }
    
    if (errors.length > 0) {
        console.log('Amount validation failed with errors:', errors);
        return res.status(400).json({ 
            message: 'Validation failed', 
            errors 
        });
    }
    
    console.log('Amount validation passed with data:', req.body);
    next();
}; 