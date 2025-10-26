// checkCloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Cloudinary using environment variable
cloudinary.config({
  cloud_name: 'dh5wd8etl',
  api_key: '926819745521177',
  api_secret: '9d6VPFUXbmUVU0zzQ3jSl3qVm4Q'
});

// Function to verify connection
async function verifyCloudinary() {
  try {
    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connection successful!");
    console.log("Response:", result);
  } catch (error) {
    console.error("❌ Cloudinary connection failed!");
    console.error("Reason:", error.message);
  }
}

verifyCloudinary();
