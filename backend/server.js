const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const stockRoutes = require("./routes/stockRoutes");
const fileRoutes = require("./routes/fileRoutes");
const StockRepo = require("./models/StockRepo");

// Load environment variables from .env file
dotenv.config({ path: "./database.env" });

const app = express();
const PORT = 5001;

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

// Initialize database
(async () => {
    try {
        await StockRepo.initialize();
        console.log("Database initialized successfully");
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
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/`);
    console.log(`⌚ ${new Date().toISOString()}`);
});


