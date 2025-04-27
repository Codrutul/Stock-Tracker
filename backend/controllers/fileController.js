const fs = require('fs');
const path = require('path');

// Set up file upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload file controller
 */
const uploadFile = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Get file info
        const fileInfo = {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: `/api/files/download/${req.file.filename}`
        };

        console.log(`✅ File uploaded successfully: ${req.file.originalname} (${req.file.size} bytes)`);
        
        // Return file info to client
        return res.status(201).json({
            message: 'File uploaded successfully',
            file: fileInfo
        });
    } catch (error) {
        console.error('❌ File upload error:', error);
        return res.status(500).json({
            message: 'Failed to upload file',
            error: error.message
        });
    }
};

/**
 * Get file list controller
 */
const getFileList = (req, res) => {
    try {
        const files = fs.readdirSync(UPLOAD_DIR);
        
        // Create file info objects with metadata
        const fileList = files.map(filename => {
            const filePath = path.join(UPLOAD_DIR, filename);
            const stats = fs.statSync(filePath);
            
            return {
                fileName: filename,
                size: stats.size,
                createdAt: stats.birthtime,
                url: `/api/files/download/${filename}`
            };
        });
        
        return res.status(200).json(fileList);
    } catch (error) {
        console.error('❌ File list error:', error);
        return res.status(500).json({
            message: 'Failed to get file list',
            error: error.message
        });
    }
};

/**
 * Download file controller
 */
const downloadFile = (req, res) => {
    try {
        const fileName = req.params.fileName;
        const filePath = path.join(UPLOAD_DIR, fileName);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Get file info
        const stats = fs.statSync(filePath);
        console.log(`📥 File download: ${fileName} (${stats.size} bytes)`);
        
        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', stats.size);
        
        // Stream file to response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('❌ File download error:', error);
        return res.status(500).json({
            message: 'Failed to download file',
            error: error.message
        });
    }
};

/**
 * Delete file controller
 */
const deleteFile = (req, res) => {
    try {
        const fileName = req.params.fileName;
        const filePath = path.join(UPLOAD_DIR, fileName);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Delete file
        fs.unlinkSync(filePath);
        console.log(`🗑️ File deleted: ${fileName}`);
        
        return res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('❌ File deletion error:', error);
        return res.status(500).json({
            message: 'Failed to delete file',
            error: error.message
        });
    }
};

module.exports = {
    uploadFile,
    getFileList,
    downloadFile,
    deleteFile
}; 