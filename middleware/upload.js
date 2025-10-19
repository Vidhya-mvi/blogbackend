const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require("path"); 


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blog-uploads', 
        allowed_formats: ['jpeg', 'png', 'gif'],
 
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
      
        cb(new Error("Only images are allowed (jpg, png, gif)"), false); 
    }
};

const upload = multer({
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});

module.exports = upload;