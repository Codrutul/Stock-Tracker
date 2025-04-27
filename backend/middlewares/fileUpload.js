const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Set up file upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Create a unique filename by adding a timestamp and random string
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        // Keep the original file extension
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}-${uniqueId}${ext}`);
    }
});

// File filter to control which files are accepted
const fileFilter = (req, file, cb) => {
    // Accept all file types for now, but you can add restrictions here
    cb(null, true);
    
    // Example of how to restrict file types:
    // const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    // if (allowedTypes.includes(file.mimetype)) {
    //     cb(null, true);
    // } else {
    //     cb(new Error('File type not allowed'), false);
    // }
};

// Configure multer with a 1GB size limit (1024 * 1024 * 1024 bytes)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 1024 // 1GB in bytes
    }
});

// Error handling middleware for multer
const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                message: 'File too large. Maximum file size is 1GB.'
            });
        }
        
        return res.status(400).json({
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        // Generic errors
        return res.status(500).json({
            message: `Server error: ${err.message}`
        });
    }
    
    next();
};

module.exports = { upload, handleMulterErrors }; 