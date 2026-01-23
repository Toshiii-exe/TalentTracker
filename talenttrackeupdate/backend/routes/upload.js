const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Determine uploads directory - use /tmp in production (Railway/Heroku)
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
const uploadsDir = isProduction
    ? path.join('/tmp', 'uploads')  // Use /tmp for Railway/cloud platforms
    : path.join(__dirname, '../uploads/');

console.log('=== Upload Configuration ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Is Production:', isProduction);
console.log('Upload directory:', uploadsDir);

// Ensure uploads directory exists and is writable
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✓ Created uploads directory');
    } else {
        console.log('✓ Uploads directory exists');
    }

    // Test write permissions
    const testFile = path.join(uploadsDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✓ Upload directory is writable');
} catch (error) {
    console.error('✗ Upload directory error:', error.message);
    console.error('  This may cause upload failures!');
}
console.log('===========================');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        console.log('Generating filename:', filename);
        cb(null, filename);
    }
});

// File filter to accept only images and PDFs
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

router.post('/', (req, res) => {
    console.log('📤 Upload request received');

    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer error
            console.error('❌ Multer error:', err.code, err.message);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            // Other errors
            console.error('❌ Upload error:', err.message);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            console.error('❌ No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return relative URL that can be accessed via http://localhost:3000/uploads/...
        const fileUrl = `/uploads/${req.file.filename}`;
        console.log('✅ File uploaded successfully:', {
            filename: req.file.filename,
            size: req.file.size,
            path: req.file.path,
            url: fileUrl
        });
        res.json({ url: fileUrl });
    });
});

module.exports = router;
