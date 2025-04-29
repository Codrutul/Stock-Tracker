const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const stockRoutes = require("./routes/stockRoutes");
const fileRoutes = require("./routes/fileRoutes");
const StockRepo = require("./models/StockRepo");
const http = require("http");
const WebSocket = require("ws");
const { faker } = require("@faker-js/faker");

// Load environment variables from .env file
dotenv.config({ path: "./database.env" });

const app = express();
const PORT = 5001;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Log request details with unique ID for tracing and make HTTP method more visible
    console.log(`\n📝 REQUEST [${requestId}] [${new Date().toISOString()}]`);
    console.log(`🔵 ${req.method.toUpperCase().padEnd(7)} ${req.url}`);
    
    // Log headers useful for debugging CORS, auth issues, etc.
    const importantHeaders = ['origin', 'authorization', 'content-type', 'user-agent'];
    const relevantHeaders = Object.keys(req.headers)
        .filter(key => importantHeaders.includes(key.toLowerCase()))
        .reduce((obj, key) => {
            // Don't log full auth tokens
            if (key.toLowerCase() === 'authorization') {
                obj[key] = req.headers[key].substring(0, 15) + '...';
            } else {
                obj[key] = req.headers[key];
            }
            return obj;
        }, {});
        
    if (Object.keys(relevantHeaders).length > 0) {
        console.log('🔷 Headers:', relevantHeaders);
    }
    
    if (Object.keys(req.body).length > 0) {
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    }
    
    if (Object.keys(req.query).length > 0) {
        console.log('🔍 Query Params:', req.query);
    }
    
    // Store request ID and start time for logging in response
    req.requestId = requestId;
    req.startTime = start;
    
    // Capture the original methods to intercept them
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override json method to log response
    res.json = function(body) {
        const duration = Date.now() - start;
        console.log(`✅ RESPONSE [${req.requestId}] [${duration}ms] (${res.statusCode}):`);
        
        if (body) {
            // Only log a preview if response body is large
            const bodyStr = JSON.stringify(body);
            const isArray = Array.isArray(body);
            
            if (isArray) {
                console.log(`Array with ${body.length} items`);
                if (body.length > 0) {
                    console.log(`First item sample: ${JSON.stringify(body[0], null, 2).substring(0, 200)}${bodyStr.length > 200 ? '...' : ''}`);
                }
            } else if (bodyStr.length > 1000) {
                console.log(bodyStr.substring(0, 1000) + '... (truncated)');
            } else {
                console.log(bodyStr);
            }
        }
        
        return originalJson.call(this, body);
    };
    
    // Override send method to log response
    res.send = function(body) {
        const duration = Date.now() - start;
        console.log(`✅ RESPONSE [${req.requestId}] [${duration}ms] (${res.statusCode})`);
        
        if (body) {
            if (typeof body === 'string' && body.length > 1000) {
                console.log(body.substring(0, 1000) + '... (truncated)');
            } else {
                console.log(typeof body === 'string' ? body : JSON.stringify(body));
            }
        }
        
        return originalSend.call(this, body);
    };
    
    next();
});

// Store connected WebSocket clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket client connected');
    
    // Add client to the set
    clients.add(ws);
    
    // Send initial data
    StockRepo.getAllStocks()
        .then(stocks => {
            ws.send(JSON.stringify({
                type: 'init',
                stocks: stocks
            }));
        })
        .catch(err => {
            console.error('Error sending initial data:', err);
        });
    
    // Handle client messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📥 Received message from client:', data);
            
            // Handle different message types here if needed
        } catch (error) {
            console.error('Error parsing client message:', error);
        }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        clients.delete(ws);
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// Broadcast data to all connected clients
function broadcastData(data) {
    try {
        // Sanitize numeric values in stock data before sending
        if (data.type === 'stockUpdates' && Array.isArray(data.stocks)) {
            data.stocks = data.stocks.map(stock => {
                const numericFields = ['price', 'amount_owned', 'change', 'marketCap', 'dividendAmount', 'peRatio'];
                
                numericFields.forEach(field => {
                    if (field in stock) {
                        // Convert to number if it's a string
                        if (typeof stock[field] === 'string') {
                            stock[field] = parseFloat(stock[field]);
                        }
                        
                        // Handle NaN or undefined
                        if (isNaN(stock[field]) || stock[field] === undefined) {
                            stock[field] = 0;
                        }
                        
                        // Round to 2 decimal places
                        stock[field] = parseFloat(parseFloat(stock[field]).toFixed(2));
                    }
                });
                
                return stock;
            });
        }
        
        const payload = JSON.stringify(data);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    } catch (error) {
        console.error('Error broadcasting data:', error);
    }
}

// Function to generate random stock price changes
function generateStockUpdates() {
    return new Promise(async (resolve, reject) => {
        try {
            const stocks = await StockRepo.getAllStocks();
            const updatedStocks = [];
            
            for (const stock of stocks) {
                // Random chance to update this stock (50%)
                if (Math.random() > 0.5) {
                    // Generate small random price change (-5% to +5%)
                    const changePercent = parseFloat(((Math.random() * 10) - 5).toFixed(2));
                    const newPrice = stock.price * (1 + (changePercent / 100));
                    const roundedPrice = Math.round(newPrice * 100) / 100;
                    
                    // Calculate the new cumulative change value and round it
                    let newChangeValue = 0;
                    if (typeof stock.change === 'number') {
                        newChangeValue = parseFloat((stock.change + changePercent).toFixed(2));
                    } else {
                        // If change is not a number, reset it to just the current change percent
                        newChangeValue = changePercent;
                    }
                    
                    // Update the stock in the database
                    await StockRepo.updateStock(stock.name, { 
                        price: roundedPrice,
                        change: newChangeValue
                    });
                    
                    // Add to the list of updated stocks
                    updatedStocks.push({
                        ...stock,
                        price: roundedPrice,
                        change: newChangeValue
                    });
                }
            }
            
            resolve(updatedStocks);
        } catch (error) {
            reject(error);
        }
    });
}

// Asynchronous thread that generates new data periodically
let isGenerating = false;
async function startDataGenerationThread() {
    if (isGenerating) return;
    isGenerating = true;
    
    console.log('🚀 Starting asynchronous data generation thread');
    
    // Run continually
    while (isGenerating) {
        try {
            // Generate updates every few seconds
            const updatedStocks = await generateStockUpdates();
            
            if (updatedStocks.length > 0) {
                console.log(`📊 Generated updates for ${updatedStocks.length} stocks`);
                
                // Broadcast updates to all clients
                broadcastData({
                    type: 'stockUpdates',
                    stocks: updatedStocks
                });
            }
            
            // Wait for 10 seconds between updates
            await new Promise(resolve => setTimeout(resolve, 10000));
        } catch (error) {
            console.error('Error in data generation thread:', error);
            // Wait a bit before trying again
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Initialize database
(async () => {
    try {
        await StockRepo.initialize();
        console.log("Database initialized successfully");
        
        // Start the data generation thread
        startDataGenerationThread();
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
})();

// Routes
app.use("/api/stocks", stockRoutes);
app.use("/api/files", fileRoutes);

// Root route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Stock-Tracker API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const duration = Date.now() - (req.startTime || Date.now());
    console.error(`❌ [${req.requestId || 'unknown'}] [${duration}ms] Error:`, err.stack);
    res.status(500).json({
        message: "Internal Server Error",
        error: err.message
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/`);
    console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
    console.log(`⌚ ${new Date().toISOString()}`);
});


