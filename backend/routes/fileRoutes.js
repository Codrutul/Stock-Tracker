const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { upload, handleMulterErrors } = require('../middlewares/fileUpload');
const rateLimit = require('express-rate-limit');

// Apply rate limiting to prevent abuse
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 file uploads per windowMs
    message: { message: 'Too many file uploads from this IP. Please try again later.' }
});

// Error handling middleware for file upload
router.use(handleMulterErrors);

// GET all files (list of files)
router.get('/', fileController.getFileList);

// POST a new file (file upload)
router.post('/upload', uploadLimiter, upload.single('file'), fileController.uploadFile);

// GET a file by name (file download)
router.get('/download/:fileName', fileController.downloadFile);

// DELETE a file by name
router.delete('/:fileName', fileController.deleteFile);

module.exports = router; 