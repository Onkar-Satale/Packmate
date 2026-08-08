// Cloudinary configuration and Multer storage middleware integration for image upload processing

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer engine with Cloudinary storage parameters
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "packmate_trips",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
  },
});

const upload = multer({ storage: storage });

export { cloudinary, upload };