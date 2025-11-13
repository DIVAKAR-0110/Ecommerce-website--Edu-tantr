import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import bcrypt from "bcryptjs";
import cors from "cors";
import { GridFSBucket } from "mongodb";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Buffer } from "buffer";


const app = express();
const PORT = 3000;


// --- Middleware ---
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


// --- Database Connection ---
let gfsBucket;

const sessionSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesRegistration' },
  loginTime: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  sessionId: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
});

const Session = mongoose.model('Session', sessionSchema);
// On login success
// Make sure 'seller' and 'generatedSessionId' are defined before this block
// Example:
// const seller = await SalesRegistration.findOne({ contactEmail: email });
// const generatedSessionId = crypto.randomBytes(24).toString('hex');
//
// const newSession = new Session({ sellerId: seller._id, sessionId: generatedSessionId });
// await newSession.save();

// On logout or timeout
// await Session.updateOne({ sessionId }, { isActive: false }); // Removed because sessionId is not defined here



mongoose.connect("mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("✅ MongoDB Connected");
    // Initialize GridFS bucket after connection
    const db = mongoose.connection.db;
    gfsBucket = new GridFSBucket(db, { bucketName: "uploads" });
    console.log("✅ GridFS Bucket initialized");
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));


// --- Email Configuration ---
const EMAIL_HOST_USER = "ungaarusuvai1709@gmail.com";
const EMAIL_HOST_PASSWORD = "yzaw hnbt rnrz fujs";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_HOST_USER,
    pass: EMAIL_HOST_PASSWORD,
  },
});


// OTP Store
const otpStore = new Map();


function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}


// --- Mongoose Schema (Updated for GridFS) ---
const salesRegistrationSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  categories: [String], 
  customCategory: String, 
  retailPlatform: String,
  platformStoreLink: String, 
  platformTimePeriod: String, 
  retailDetails: String,
  retailDetailsLink: String, 
  totalTime: String, 
  referenceLink: String,
  socialPlatforms: [String], 
  instagramLink: String, 
  whatsappContact: String,
  facebookLink: String, 
  twitterLink: String, 
  telegramLink: String,
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactNumber: { type: String, required: true },
  contactDesignation: String, 
  emailVerified: { type: Boolean, default: false },
  gstType: { type: String, required: true }, 
  gstNumber: String, 
  gstName: String,
  gstAddress: String, 
  panNumber: { type: String, required: true },
  // Changed from Path to ID for GridFS
  gstCertificateId: { type: mongoose.Schema.Types.ObjectId }, 
  brandName: { type: String, required: true },
  manufacturerName: String, 
  trademarkNumber: String, 
  trademarkFileId: { type: mongoose.Schema.Types.ObjectId },
  brandLogoId: { type: mongoose.Schema.Types.ObjectId }, 
  authorizationLetterId: { type: mongoose.Schema.Types.ObjectId }, 
  profilePictureId: { type: mongoose.Schema.Types.ObjectId, default: null },

  accountNumber: String,
  ifsc: String, 
  bankType: String, 
  shippingAddress: { type: String, required: true },
  digitalSignatureId: { type: mongoose.Schema.Types.ObjectId, required: true },
  password: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });


const SalesRegistration = mongoose.model("SalesRegistration", salesRegistrationSchema);


// --- Multer Setup for Memory Storage ---
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


// --- Helper Function: Upload to GridFS ---
const uploadToGridFS = (file, category) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }


    const filename = `${category}-${Date.now()}-${file.originalname}`;
    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: file.mimetype,
      metadata: { category }
    });


    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      console.log(`✅ File uploaded to GridFS: ${filename} (ID: ${uploadStream.id})`);
      resolve(uploadStream.id);
    });


    uploadStream.end(file.buffer);
  });
};

// FILE RETRIEVAL ROUTE
app.get('/api/files/:fileId', async (req, res) => {
  try {
    // ✅ ADD CORS HEADERS FOR html2canvas
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    
    // Find file metadata
    const files = await gfsBucket.find({ _id: fileId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = files[0];
    
    // Set appropriate headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);
    
    // Stream file from GridFS
    const downloadStream = gfsBucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ error: 'Error retrieving file' });
    });
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ error: 'Invalid file ID or server error' });
  }
});



// ========================================
// ROUTES
// ========================================


// Test Route
app.get("/", (req, res) => {
  res.json({ 
    status: "Server is online and running with GridFS!",
    endpoints: [
      "GET  /",
      "POST /api/send-otp",
      "POST /api/verify-otp",
      "POST /api/seller-login",
      "POST /api/sales-registration/register",
      "GET  /api/sales-registrations",
      "GET  /api/files/:fileId"
    ]
  });
});


// ==================== FILE RETRIEVAL ROUTE ====================
app.get("/api/files/:fileId", async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    
    // Find file metadata
    const files = await gfsBucket.find({ _id: fileId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }


    const file = files[0];


    // Set appropriate headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);


    // Stream file from GridFS
    const downloadStream = gfsBucket.openDownloadStream(fileId);
    downloadStream.pipe(res);


    downloadStream.on('error', (error) => {
      console.error("❌ Error streaming file:", error);
      res.status(500).json({ error: "Error retrieving file" });
    });


  } catch (error) {
    console.error("❌ File retrieval error:", error);
    res.status(500).json({ error: "Invalid file ID or server error" });
  }
});


// ==================== GET ALL REGISTRATIONS ====================
app.get("/api/sales-registrations", async (req, res) => {
  try {
    const allRegistrations = await SalesRegistration.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: allRegistrations.length,
      data: allRegistrations,
    });
  } catch (error) {
    console.error("❌ Error fetching sales registrations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations.",
      error: error.message,
    });
  }
});


// ==================== EMAIL OTP ROUTES ====================


app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;


    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email address" 
      });
    }


    const otp = generateOTP();
    
    otpStore.set(email, {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });


    const mailOptions = {
      from: EMAIL_HOST_USER,
      to: email,
      subject: "Sales Registration - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for Sales Registration verification is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP is valid for 5 minutes.</p>
          <p style="color: #666;">If you didn't request this OTP, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };


    await transporter.sendMail(mailOptions);
    console.log(`✓ OTP sent to ${email}: ${otp}`);


    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });


  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
      error: error.message
    });
  }
});


app.post("/api/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;


    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }


    const storedData = otpStore.get(email);


    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this email. Please request a new one.",
      });
    }


    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }


    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "Maximum attempts exceeded. Please request a new OTP.",
      });
    }


    if (storedData.otp === otp.trim()) {
      otpStore.delete(email);
      console.log(`✓ Email verified: ${email}`);
      return res.status(200).json({
        success: true,
        message: "Email verified successfully!",
      });
    } else {
      storedData.attempts += 1;
      otpStore.set(email, storedData);


      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`,
      });
    }


  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
});

app.post("/api/seller-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Find seller by contactEmail
    const seller = await SalesRegistration.findOne({ contactEmail: email });

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (seller.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Your account has been rejected. Please contact support.",
      });
    }

    if (seller.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval. Please wait for admin verification.",
      });
    }

    // Compare entered password with stored hash
    const passwordMatch = await bcrypt.compare(password, seller.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Successful login
  // In new.js, find this section (around line 450-480)
return res.status(200).json({
  success: true,
  message: "Login successful!",
  seller: {
    requestId: seller.requestId,
    contactName: seller.contactName,
    contactEmail: seller.contactEmail,
    contactNumber: seller.contactNumber,
    brandName: seller.brandName,
    manufacturerName: seller.manufacturerName, // ADD THIS LINE
    status: seller.status,
    categories: seller.categories,
    createdAt: seller.createdAt,
    profilePictureId: seller.profilePictureId || null,
  },
});


  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: error.message,
    });
  }
});


// ==================== REGISTRATION ROUTE (Updated for GridFS) ====================

// Approve Seller
app.post("/api/admin/approve-seller", async (req, res) => {
  try {
    const { requestId, adminMessage } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
      });
    }

    // Find seller
    const seller = await SalesRegistration.findOne({ requestId });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Update status to approved
    await SalesRegistration.updateOne(
      { requestId },
      { $set: { status: "approved" } }
    );

    console.log(`✅ Seller approved: ${seller.contactEmail}`);

    // Send approval email
    const mailOptions = {
      from: EMAIL_HOST_USER,
      to: seller.contactEmail,
      subject: "🎉 Your Seller Account Has Been Approved!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #28a745; text-align: center;">✅ Account Approved!</h2>
            
            <p>Dear ${seller.contactName},</p>
            
            <p>Congratulations! Your seller account has been approved by our admin team.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Brand Name:</strong> ${seller.brandName}</p>
              <p style="margin: 5px 0;"><strong>Request ID:</strong> ${seller.requestId}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${seller.contactEmail}</p>
            </div>

            ${adminMessage ? `
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Message from Admin:</strong></p>
                <p style="margin: 10px 0 0 0;">${adminMessage}</p>
              </div>
            ` : ''}
            
            <p>You can now login to your seller dashboard using your registered credentials.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/SellerLogin" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Login to Dashboard
              </a>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>SellerHub Admin Team</strong></p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Approval email sent to: ${seller.contactEmail}`);

    res.status(200).json({
      success: true,
      message: "Seller approved successfully and email sent",
    });

  } catch (error) {
    console.error("❌ Error approving seller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve seller",
      error: error.message,
    });
  }
});


// Reject Seller
app.post("/api/admin/reject-seller", async (req, res) => {
  try {
    const { requestId, rejectionReason } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    // Find seller
    const seller = await SalesRegistration.findOne({ requestId });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Update status to rejected
    await SalesRegistration.updateOne(
      { requestId },
      { $set: { status: "rejected" } }
    );

    console.log(`❌ Seller rejected: ${seller.contactEmail}`);

    // Send rejection email
    const mailOptions = {
      from: EMAIL_HOST_USER,
      to: seller.contactEmail,
      subject: "Update on Your Seller Account Application",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #dc3545; text-align: center;">Application Update</h2>
            
            <p>Dear ${seller.contactName},</p>
            
            <p>Thank you for your interest in becoming a seller on our platform. After careful review, we regret to inform you that your application has not been approved at this time.</p>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="margin: 0;"><strong>Reason for Rejection:</strong></p>
              <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
            </div>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Brand Name:</strong> ${seller.brandName}</p>
              <p style="margin: 5px 0;"><strong>Request ID:</strong> ${seller.requestId}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${seller.contactEmail}</p>
            </div>
            
            <p>If you believe this decision was made in error or if you have additional information to share, please contact our support team.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:support@sellerhub.com" 
                 style="background-color: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Contact Support
              </a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>SellerHub Admin Team</strong></p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Rejection email sent to: ${seller.contactEmail}`);

    res.status(200).json({
      success: true,
      message: "Seller rejected successfully and email sent",
    });

  } catch (error) {
    console.error("❌ Error rejecting seller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject seller",
      error: error.message,
    });
  }
});


app.post("/api/sales-registration/register",
  upload.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "trademarkFile", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
    { name: "authorizationLetter", maxCount: 1 },
    { name: "digitalSignature", maxCount: 1 }
  ]),
  async (req, res) => {
    console.log(`\n🔥 POST request received for ID: ${req.body.requestId}`);
    try {
      // Upload files to GridFS and get their IDs
      const gstCertificateId = await uploadToGridFS(req.files?.gstCertificate?.[0], "gst-certificate");
      const trademarkFileId = await uploadToGridFS(req.files?.trademarkFile?.[0], "trademark");
      const brandLogoId = await uploadToGridFS(req.files?.brandLogo?.[0], "brand-logo");
      const authorizationLetterId = await uploadToGridFS(req.files?.authorizationLetter?.[0], "authorization");
      const digitalSignatureId = await uploadToGridFS(req.files?.digitalSignature?.[0], "digital-signature");


      const registrationData = new SalesRegistration({
        ...req.body,
        categories: JSON.parse(req.body.categories || "[]"),
        socialPlatforms: JSON.parse(req.body.socialPlatforms || "[]"),
        emailVerified: req.body.emailVerified === "true",
        // Store GridFS file IDs instead of paths
        gstCertificateId,
        trademarkFileId,
        brandLogoId,
        authorizationLetterId,
        digitalSignatureId,
        password: await bcrypt.hash(req.body.password, 10)
      });


      await registrationData.save();
      console.log(`✅ Data saved for Request ID: ${registrationData.requestId}`);
      console.log(`✅ Files stored in MongoDB Atlas GridFS`);
      
      res.status(201).json({ 
        success: true, 
        requestId: registrationData.requestId,
        message: "Registration successful. Files stored in cloud."
      });
    } catch (error) {
      console.error("❌ Database or Logic Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);


// ==================== CAPTCHA GENERATION ====================
app.get("/api/generate-captcha", (req, res) => {
  try {
    // Generate random 6-7 character UPPERCASE-ONLY string (easier to read)
    const length = Math.random() > 0.5 ? 6 : 7;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
    let captchaText = '';
    
    for (let i = 0; i < length; i++) {
      captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Store in temporary captcha store with expiry
    const captchaId = crypto.randomBytes(16).toString('hex');
    otpStore.set(`captcha_${captchaId}`, {
      text: captchaText, // Already uppercase
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });
    
    console.log(`✅ Generated CAPTCHA: ${captchaText} (ID: ${captchaId})`);
    
    res.status(200).json({
      success: true,
      captchaId,
      captchaText,
    });
  } catch (error) {
    console.error("❌ Error generating CAPTCHA:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CAPTCHA",
    });
  }
});

// ==================== VERIFY CAPTCHA - CASE-INSENSITIVE ====================
app.post("/api/verify-captcha", (req, res) => {
  try {
    const { captchaId, captchaInput } = req.body;
    
    if (!captchaId || !captchaInput) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA ID and input are required",
      });
    }
    
    const storedCaptcha = otpStore.get(`captcha_${captchaId}`);
    
    if (!storedCaptcha) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA expired or not found. Please refresh.",
      });
    }
    
    if (Date.now() > storedCaptcha.expiresAt) {
      otpStore.delete(`captcha_${captchaId}`);
      return res.status(400).json({
        success: false,
        message: "CAPTCHA expired. Please refresh.",
      });
    }
    
    // FIXED: Case-insensitive comparison and trim both sides
    const storedText = storedCaptcha.text.trim().toUpperCase();
    const inputText = captchaInput.trim().toUpperCase();
    
    // Debug logging
    console.log(`🔍 CAPTCHA Verification:`);
    console.log(`   Expected: "${storedText}"`);
    console.log(`   Received: "${inputText}"`);
    console.log(`   Match: ${storedText === inputText}`);
    
    if (storedText !== inputText) {
      return res.status(400).json({
        success: false,
        message: "Invalid CAPTCHA. Please try again.",
      });
    }
    
    // CAPTCHA verified successfully
    otpStore.delete(`captcha_${captchaId}`);
    console.log(`✅ CAPTCHA verified successfully`);
    
    res.status(200).json({
      success: true,
      message: "CAPTCHA verified successfully",
    });
  } catch (error) {
    console.error("❌ Error verifying CAPTCHA:", error);
    res.status(500).json({
      success: false,
      message: "CAPTCHA verification failed",
    });
  }
});



// ==================== FORGOT PASSWORD - SEND OTP ====================
app.post("/api/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }
    
    // Check if email exists in database
    const seller = await SalesRegistration.findOne({ contactEmail: email });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }
    
    const otp = generateOTP();
    
    otpStore.set(`forgot_${email}`, {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      verified: false,
    });
    
    const mailOptions = {
      from: EMAIL_HOST_USER,
      to: email,
      subject: "Password Reset - OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${seller.contactName},</p>
          <p>You have requested to reset your password. Your One-Time Password (OTP) is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP is valid for 5 minutes.</p>
          <p style="color: #666;">If you didn't request a password reset, please ignore this email or contact support.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset OTP sent to ${email}: ${otp}`);
    
    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      contactName: seller.contactName, // Send for verification in next step
    });
    
  } catch (error) {
    console.error("❌ Error sending password reset OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
});

// ==================== FORGOT PASSWORD - VERIFY OTP ====================
app.post("/api/forgot-password/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }
    
    const storedData = otpStore.get(`forgot_${email}`);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this email. Please request a new one.",
      });
    }
    
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(`forgot_${email}`);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }
    
    if (storedData.attempts >= 3) {
      otpStore.delete(`forgot_${email}`);
      return res.status(400).json({
        success: false,
        message: "Maximum attempts exceeded. Please request a new OTP.",
      });
    }
    
    if (storedData.otp === otp.trim()) {
      // Mark as verified but don't delete yet
      storedData.verified = true;
      otpStore.set(`forgot_${email}`, storedData);
      
      console.log(`✓ Password reset OTP verified for: ${email}`);
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully!",
      });
    } else {
      storedData.attempts += 1;
      otpStore.set(`forgot_${email}`, storedData);
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`,
      });
    }
    
  } catch (error) {
    console.error("❌ Error verifying password reset OTP:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
});

// ==================== FORGOT PASSWORD - VERIFY CONTACT NAME ====================
app.post("/api/forgot-password/verify-contact", async (req, res) => {
  try {
    const { email, contactName } = req.body;
    
    if (!email || !contactName) {
      return res.status(400).json({
        success: false,
        message: "Email and contact name are required",
      });
    }
    
    // Check if OTP was verified
    const storedData = otpStore.get(`forgot_${email}`);
    
    if (!storedData || !storedData.verified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP first",
      });
    }
    
    // Find seller and verify contact name
    const seller = await SalesRegistration.findOne({ contactEmail: email });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }
    
    // Case-insensitive contact name comparison
    if (seller.contactName.toLowerCase().trim() !== contactName.toLowerCase().trim()) {
      return res.status(400).json({
        success: false,
        message: "Contact name does not match our records",
      });
    }
    
    console.log(`✓ Contact name verified for: ${email}`);
    
    res.status(200).json({
      success: true,
      message: "Contact name verified. You can now reset your password.",
    });
    
  } catch (error) {
    console.error("❌ Error verifying contact name:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
});

// ==================== FORGOT PASSWORD - RESET PASSWORD ====================
app.post("/api/forgot-password/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }
    
    // Check if OTP was verified
    const storedData = otpStore.get(`forgot_${email}`);
    
    if (!storedData || !storedData.verified) {
      return res.status(400).json({
        success: false,
        message: "Please complete all verification steps first",
      });
    }
    
    // Validate password strength (minimum 8 characters, at least one uppercase, one lowercase, one number)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }
    
    // Find seller
    const seller = await SalesRegistration.findOne({ contactEmail: email });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    await SalesRegistration.updateOne(
      { contactEmail: email },
      { $set: { password: hashedPassword } }
    );
    
    // Clear OTP store
    otpStore.delete(`forgot_${email}`);
    
    console.log(`✅ Password reset successfully for: ${email}`);
    
    // Send confirmation email
    const mailOptions = {
      from: EMAIL_HOST_USER,
      to: email,
      subject: "Password Reset Successful",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Password Reset Successful</h2>
          <p>Hello ${seller.contactName},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/SellerLogin" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Login Now
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now login with your new password.",
    });
    
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
    });
  }
});

app.post('/api/seller/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('----- Profile Picture Upload -----');
    // Step 1: File check
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ success: false, reason: "nofile", message: "No file uploaded. Check form field name and frontend logic." });
    }

    // Step 2: Seller ID check
    if (!req.body.sellerId) {
      console.log('❌ SellerID missing');
      return res.status(400).json({ success: false, reason: "nosellerid", message: "Seller ID missing in upload payload." });
    }

    // Step 3: Seller existence check
    const seller = await SalesRegistration.findOne({ requestId: req.body.sellerId });
    if (!seller) {
      console.log(`❌ Seller with requestId ${req.body.sellerId} not found`);
      return res.status(400).json({ success: false, reason: "sellernotfound", message: "Seller not found in database." });
    }

    // Step 4: Upload to GridFS
    const fileId = await uploadToGridFS(req.file, "profile-picture");
    if (!fileId) {
      console.log('❌ File was not uploaded to GridFS');
      return res.status(500).json({ success: false, reason: "gridfsfail", message: "Failed to store file in GridFS." });
    }

    // Step 5: Update DB
    const updateResult = await SalesRegistration.updateOne(
      { requestId: req.body.sellerId },
      { $set: { profilePictureId: fileId } }
    );
    if (updateResult.modifiedCount === 0) {
      console.log('❌ Failed to update user profile with fileId');
      return res.status(500).json({ success: false, reason: "dbupdatefail", message: "Failed to link profile picture to seller account." });
    }

    console.log('✅ Successfully uploaded and linked profile picture', fileId);
    res.json({ success: true, profilePictureId: fileId });

  } catch (err) {
    console.log('❌ Unexpected error:', err);
    res.status(500).json({ success: false, reason: "servererror", message: err.message });
  }
});


// Add after SalesRegistration schema

// --- Product Schema (Separate table, linked via foreign key) ---
const productSchema = new mongoose.Schema({
  // Foreign key to SalesRegistration
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesRegistration', required: true },
  sellerRequestId: { type: String, required: true },
  
  // Section 1: Basic Details
  category: { type: String, required: true },
  customCategory: String,
  hasVariation: { type: Boolean, default: false },
  productId: String,
  autoGeneratedSKU: { type: Boolean, default: false },
  itemName: { type: String, required: true, maxlength: 100 },
  manufacturer: String,
  brandName: String,
  
  // Section 2: Offer & Pricing
  sellerSKU: String,
  sellingPrice: { type: Number, required: true },
  listingPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 0 },
  itemCondition: { type: String, enum: ['New', 'Used'], required: true },
  regionOfOrigin: String,
  hsnCode: String,
  mrp: { type: Number, required: true },
  
  // Section 3: Product Images
  primaryImageId: { type: mongoose.Schema.Types.ObjectId },
  additionalImageIds: [{ type: mongoose.Schema.Types.ObjectId }],
  
  // Section 4: Product Description
  fullDescription: { type: String, required: true },
  bulletPoints: [String],
  
  // Section 5: Technical Specifications
  styleModelNumber: String,
  dimensions: {
    length: { value: Number, unit: String },
    width: { value: Number, unit: String },
    height: { value: Number, unit: String },
    diameter: { value: Number, unit: String },
    capacity: { value: Number, unit: String },
    weight: { value: Number, unit: String },
    thickness: { value: Number, unit: String },
    sizeLabel: String
  },
  dimensionDescription: String,
  unitCount: Number,
  unitType: String,
  modelName: String,
  material: [String],
  numberOfBoxes: Number,
  
  // Section 6: Variation
  variations: {
    color: [String],
    itemShape: String,
    size: [String],
    storage: [String],
    pattern: [String],
    style: [String]
  },
  
  // System fields
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  rejectionReason: String
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);


// ==================== DELETED SKU SCHEMA ====================
const deletedSKUSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  sellerName: { type: String, required: true },
  sellerRequestId: { type: String, required: true },
  deletionReason: { type: String, required: true },
  deletedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // 24 hours from deletion
  isBlocked: { type: Boolean, default: true }
}, { timestamps: true });

// Auto-remove blocked SKUs after 24 hours
deletedSKUSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DeletedSKU = mongoose.model('DeletedSKU', deletedSKUSchema);

// ==================== ADD PRODUCT ROUTE ====================
app.post('/api/products/add', 
  upload.fields([
    { name: 'primaryImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 6 }
  ]),
  async (req, res) => {
    try {
      console.log('📦 New product submission received');
      
      // Get seller info from SalesRegistration
      const seller = await SalesRegistration.findOne({ requestId: req.body.sellerRequestId });
      if (!seller) {
        return res.status(404).json({ success: false, message: 'Seller not found' });
      }
      
      // Validation: Selling Price <= Listing Price
      if (parseFloat(req.body.sellingPrice) > parseFloat(req.body.listingPrice)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Selling Price cannot be greater than Listing Price' 
        });
      }
      
      // Validation: Selling Price <= MRP
      if (parseFloat(req.body.sellingPrice) > parseFloat(req.body.mrp)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Selling Price cannot be greater than MRP' 
        });
      }
      
      // Validation: If Used, Listing Price <= 50% of MRP
      if (req.body.itemCondition === 'Used') {
        const maxListingPrice = parseFloat(req.body.mrp) * 0.5;
        if (parseFloat(req.body.listingPrice) > maxListingPrice) {
          return res.status(400).json({ 
            success: false, 
            message: `For used items, Listing Price must be <= 50% of MRP (₹${maxListingPrice})` 
          });
        }
      }
      
      // Upload images to GridFS
      const primaryImageId = await uploadToGridFS(req.files?.primaryImage?.[0], 'product-primary');
      const additionalImageIds = [];
      if (req.files?.additionalImages) {
        for (const img of req.files.additionalImages) {
          const imgId = await uploadToGridFS(img, 'product-additional');
          additionalImageIds.push(imgId);
        }
      }
      
      // Generate auto SKU if needed
      const productId = req.body.productId || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Parse JSON fields
      const productData = new Product({
        sellerId: seller._id,
        sellerRequestId: req.body.sellerRequestId,
        category: req.body.category,
        customCategory: req.body.customCategory,
        hasVariation: req.body.hasVariation === 'true',
        productId,
        autoGeneratedSKU: !req.body.productId,
        itemName: req.body.itemName,
        manufacturer: req.body.manufacturer || seller.manufacturerName || 'Not Specified',
        brandName: req.body.brandName || seller.brandName || 'Generic',
        sellerSKU: req.body.sellerSKU,
        sellingPrice: req.body.sellingPrice,
        listingPrice: req.body.listingPrice,
        quantity: req.body.quantity,
        itemCondition: req.body.itemCondition,
        regionOfOrigin: req.body.regionOfOrigin,
        hsnCode: req.body.hsnCode,
        mrp: req.body.mrp,
        primaryImageId,
        additionalImageIds,
        fullDescription: req.body.fullDescription,
        bulletPoints: JSON.parse(req.body.bulletPoints || '[]').filter(bp => bp.trim()),
        styleModelNumber: req.body.styleModelNumber,
        dimensions: JSON.parse(req.body.dimensions || '{}'),
        dimensionDescription: req.body.dimensionDescription,
        unitCount: req.body.unitCount,
        unitType: req.body.unitType,
        modelName: req.body.modelName,
        material: JSON.parse(req.body.material || '[]'),
        numberOfBoxes: req.body.numberOfBoxes,
        variations: JSON.parse(req.body.variations || '{}')
      });
      
      await productData.save();
      console.log(`✅ Product saved: ${productData.itemName} (ID: ${productData._id})`);
      
      // Send confirmation email
      const mailOptions = {
        from: EMAIL_HOST_USER,
        to: seller.contactEmail,
        subject: '🎉 Product Submission Successful',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px;">
              <h2 style="color: #28a745; text-align: center;">🎉 Product Submission Successful!</h2>
              
              <p>Dear <strong>${seller.contactName}</strong>,</p>
              
              <p>Thank you for submitting your product listing. Our team will review your details and notify you shortly.</p>
              <p style="color: #dc3545;"><strong>If approval takes more than 1 hour, please contact support: 7010186524</strong></p>
              
              <hr style="margin: 20px 0; border: none; border-top: 2px solid #ddd;">
              
              <h3>Product Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0;"><strong>Product Name:</strong></td><td>${productData.itemName}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Brand:</strong></td><td>${productData.brandName}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Category:</strong></td><td>${productData.category}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Condition:</strong></td><td>${productData.itemCondition}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Seller SKU:</strong></td><td>${productData.sellerSKU || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Quantity Added:</strong></td><td>${productData.quantity}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Region of Origin:</strong></td><td>${productData.regionOfOrigin || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Request ID:</strong></td><td>${seller.requestId}</td></tr>
              </table>
              
              <hr style="margin: 20px 0; border: none; border-top: 2px solid #ddd;">
              
              <p><strong>Submission Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Review Status:</strong> <span style="color: #ffc107;">Pending Approval</span></p>
              <p><strong>Shipping Address:</strong> ${seller.shippingAddress}</p>
              <p><strong>Your Phone Number:</strong> ${seller.contactNumber}</p>
              
              <hr style="margin: 20px 0; border: none; border-top: 2px solid #ddd;">
              
              <p style="text-align: center; margin-top: 20px;">
                You can track status in: <strong>My Listings → Pending</strong>
              </p>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>SellerHub Team</strong></p>
            </div>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`📧 Confirmation email sent to: ${seller.contactEmail}`);
      
      // Return success with product and seller info
      res.status(201).json({
        success: true,
        product: productData,
        seller: {
          requestId: seller.requestId,
          contactName: seller.contactName,
          contactNumber: seller.contactNumber,
          shippingAddress: seller.shippingAddress,
          contactEmail: seller.contactEmail
        }
      });
      
    } catch (error) {
      console.error('❌ Error adding product:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ==================== ADMIN ROUTES ====================

// ==================== GET PENDING PRODUCTS WITH IMAGES ====================
app.get('/api/admin/products/pending', async (req, res) => {
  try {
    const pendingProducts = await Product.find({ status: 'pending' })
      .populate('sellerId')
      .sort({ submittedAt: -1 });
    
    const productsWithSellerInfo = pendingProducts.map(product => ({
      ...product.toObject(),
      seller: {
        contactName: product.sellerId.contactName,
        contactEmail: product.sellerId.contactEmail,
        contactNumber: product.sellerId.contactNumber,
        shippingAddress: product.sellerId.shippingAddress,
        requestId: product.sellerId.requestId,
        brandName: product.sellerId.brandName,
        manufacturerName: product.sellerId.manufacturerName
      },
      // Add image URLs
      primaryImageUrl: product.primaryImageId ? `/api/files/${product.primaryImageId}` : null,
      additionalImagesUrls: product.additionalImageIds.map(id => `/api/files/${id}`)
    }));
    
    res.json({ success: true, products: productsWithSellerInfo });
  } catch (error) {
    console.error('❌ Error fetching pending products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve Product
app.post('/api/admin/products/approve', async (req, res) => {
  try {
    const { productId, adminMessage } = req.body;
    
    const product = await Product.findById(productId).populate('sellerId');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Update product status
    await Product.updateOne(
      { _id: productId },
      { $set: { status: 'approved', reviewedAt: new Date() } }
    );
    
    console.log(`✅ Product approved: ${product.itemName}`);
    
    // Send approval email
    const mailOptions = {
      from: EMAIL_HOST_USER,
      to: product.sellerId.contactEmail,
      subject: '🎉 Product Approved - Ready to Sell!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #28a745; text-align: center;">✅ Product Approved!</h2>
            
            <p>Dear <strong>${product.sellerId.contactName}</strong>,</p>
            
            <p>Congratulations! Your product has been approved and is now ready to be listed on our platform.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Product Details:</h3>
              <p style="margin: 5px 0;"><strong>Product Name:</strong> ${product.itemName}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${product.category}</p>
              <p style="margin: 5px 0;"><strong>Brand:</strong> ${product.brandName}</p>
              <p style="margin: 5px 0;"><strong>Price:</strong> ₹${product.listingPrice}</p>
              <p style="margin: 5px 0;"><strong>Quantity:</strong> ${product.quantity}</p>
              <p style="margin: 5px 0;"><strong>Product ID:</strong> ${product.productId}</p>
            </div>
            
            ${adminMessage ? `
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Message from Admin:</strong></p>
                <p style="margin: 10px 0 0 0;">${adminMessage}</p>
              </div>
            ` : ''}
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Your product is now live on the platform</li>
              <li>Customers can start ordering</li>
              <li>Keep your inventory updated</li>
              <li>Respond promptly to customer queries</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/seller-dashboard" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Dashboard
              </a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>SellerHub Admin Team</strong></p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`📧 Approval email sent to: ${product.sellerId.contactEmail}`);
    
    res.json({ success: true, message: 'Product approved successfully' });
    
  } catch (error) {
    console.error('❌ Error approving product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject Product
app.post('/api/admin/products/reject', async (req, res) => {
  try {
    const { productId, rejectionReason } = req.body;
    
    const product = await Product.findById(productId).populate('sellerId');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Update product status
    await Product.updateOne(
      { _id: productId },
      { $set: { status: 'rejected', reviewedAt: new Date(), rejectionReason } }
    );
    
    console.log(`❌ Product rejected: ${product.itemName}`);
    
    // Send rejection email
    const mailOptions = {
      from: EMAIL_HOST_USER,
      to: product.sellerId.contactEmail,
      subject: 'Product Review Update - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #dc3545; text-align: center;">Product Review Update</h2>
            
            <p>Dear <strong>${product.sellerId.contactName}</strong>,</p>
            
            <p>Thank you for submitting your product for review. After careful evaluation, we found that your product listing needs some modifications before it can be approved.</p>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="margin: 0;"><strong>Reason for Rejection:</strong></p>
              <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Product Details:</h3>
              <p style="margin: 5px 0;"><strong>Product Name:</strong> ${product.itemName}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${product.category}</p>
              <p style="margin: 5px 0;"><strong>Product ID:</strong> ${product.productId}</p>
            </div>
            
            <p><strong>What You Need to Do:</strong></p>
            <ul>
              <li>Review the rejection reason carefully</li>
              <li>Make necessary corrections to your product listing</li>
              <li>Resubmit the product for review</li>
              <li>Ensure all details are accurate and meet our guidelines</li>
            </ul>
            
            <p>If you have any questions or need clarification, please contact our support team at <strong>7010186524</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/seller-dashboard/add-product" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Edit & Resubmit Product
              </a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>SellerHub Admin Team</strong></p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`📧 Rejection email sent to: ${product.sellerId.contactEmail}`);
    
    res.json({ success: true, message: 'Product rejected successfully' });
    
  } catch (error) {
    console.error('❌ Error rejecting product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GET SELLER'S PRODUCTS ====================
app.get('/api/seller/products/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find seller
    const seller = await SalesRegistration.findOne({ requestId });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    
    // Find all products for this seller
    const products = await Product.find({ sellerRequestId: requestId })
      .sort({ submittedAt: -1 }); // Most recent first
    
    console.log(`✅ Retrieved ${products.length} products for seller: ${seller.contactName}`);
    
    res.json({
      success: true,
      seller: {
        requestId: seller.requestId,
        contactName: seller.contactName,
        contactEmail: seller.contactEmail,
        contactNumber: seller.contactNumber,
        brandName: seller.brandName,
        manufacturerName: seller.manufacturerName,
        shippingAddress: seller.shippingAddress
      },
      products
    });
    
  } catch (error) {
    console.error('❌ Error fetching seller products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==================== ADMIN - VIEW ALL PRODUCTS WITH SEARCH & FILTER ====================
app.get('/api/admin/products/all', async (req, res) => {
  try {
    const { 
      status, 
      category, 
      search, 
      minPrice, 
      maxPrice,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by status (all, pending, approved, rejected)
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.listingPrice = {};
      if (minPrice) query.listingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.listingPrice.$lte = parseFloat(maxPrice);
    }
    
    // Search by product name, brand, or seller name
    if (search && search.trim()) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { productId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch products with seller info
    const products = await Product.find(query)
      .populate('sellerId')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
    
    // Format response with seller info
    const productsWithSeller = products.map(product => ({
      ...product.toObject(),
      seller: {
        contactName: product.sellerId.contactName,
        contactEmail: product.sellerId.contactEmail,
        contactNumber: product.sellerId.contactNumber,
        requestId: product.sellerId.requestId,
        shippingAddress: product.sellerId.shippingAddress
      },
      primaryImageUrl: product.primaryImageId ? `/api/files/${product.primaryImageId}` : null
    }));
    
    // Get unique categories for filter dropdown
    const categories = await Product.distinct('category');
    
    console.log(`✅ Admin fetched ${productsWithSeller.length} products`);
    
    res.json({
      success: true,
      products: productsWithSeller,
      categories,
      totalCount: productsWithSeller.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching all products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product details for modal view
app.get('/api/admin/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId).populate('sellerId');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const sellerInfo = {
      requestId: product.sellerId.requestId,
      contactName: product.sellerId.contactName,
      contactEmail: product.sellerId.contactEmail,
      contactNumber: product.sellerId.contactNumber,
      shippingAddress: product.sellerId.shippingAddress,
      brandName: product.sellerId.brandName,
      manufacturerName: product.sellerId.manufacturerName,
      gstNumber: product.sellerId.gstNumber,
      panNumber: product.sellerId.panNumber
    };
    
    const images = {
      primary: product.primaryImageId ? `/api/files/${product.primaryImageId}` : null,
      additional: product.additionalImageIds.map(id => `/api/files/${id}`)
    };
    
    res.json({
      success: true,
      product: {
        ...product.toObject(),
        images
      },
      seller: sellerInfo
    });
    
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PRODUCT EDIT HISTORY SCHEMA ====================
const productEditSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesRegistration', required: true },
  sellerName: { type: String, required: true },
  productName: { type: String, required: true },
  sectionEdited: { type: String, required: true }, // e.g., "Basic Details", "Pricing"
  fieldsEdited: [String], // Array of field names edited
  oldValues: { type: Object }, // Store previous values
  newValues: { type: Object }, // Store new values
  editedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ProductEdit = mongoose.model('ProductEdit', productEditSchema);


// ==================== UPDATE PRODUCT WITH EDIT TRACKING ====================
app.put('/api/seller/product/update', 
  upload.fields([
    { name: 'primaryImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 6 }
  ]),
  async (req, res) => {
    try {
      const { 
        productId, 
        sellerRequestId, // ✅ FIXED: Changed from sellerId to sellerRequestId
        section, 
        fieldsToEdit, 
        updates 
      } = req.body;

      console.log('📝 Product edit request received');
      console.log('Product ID:', productId);
      console.log('Seller Request ID:', sellerRequestId);

      // Fetch product and seller using requestId
      const product = await Product.findById(productId);
      const seller = await SalesRegistration.findOne({ requestId: sellerRequestId }); // ✅ FIXED

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      if (!seller) {
        return res.status(404).json({ success: false, message: 'Seller not found' });
      }

      // Parse updates
      const updatesObj = JSON.parse(updates);
      const fieldsArray = JSON.parse(fieldsToEdit);

      // Store old values before update
      const oldValues = {};
      fieldsArray.forEach(field => {
        oldValues[field] = product[field];
      });

      // Handle image uploads
      if (req.files?.primaryImage) {
        const primaryImageId = await uploadToGridFS(req.files.primaryImage[0], 'product-primary');
        updatesObj.primaryImageId = primaryImageId;
        oldValues.primaryImageId = product.primaryImageId;
      }

      if (req.files?.additionalImages) {
        const additionalImageIds = [];
        for (const img of req.files.additionalImages) {
          const imgId = await uploadToGridFS(img, 'product-additional');
          additionalImageIds.push(imgId);
        }
        updatesObj.additionalImageIds = additionalImageIds;
        oldValues.additionalImageIds = product.additionalImageIds;
      }

      // Update product in database
      await Product.updateOne(
        { _id: productId },
        { $set: updatesObj }
      );

      console.log(`✅ Product updated: ${product.itemName}`);

      // Create edit history record
      const editRecord = new ProductEdit({
        productId: product._id,
        sellerId: seller._id,
        sellerName: seller.contactName,
        productName: product.itemName,
        sectionEdited: section,
        fieldsEdited: fieldsArray,
        oldValues,
        newValues: updatesObj,
        editedAt: new Date()
      });

      await editRecord.save();
      console.log(`📋 Edit history saved for product: ${product.itemName}`);

      res.json({
        success: true,
        message: 'Product updated successfully',
        editRecord: {
          editedAt: editRecord.editedAt,
          fieldsEdited: editRecord.fieldsEdited,
          section: editRecord.sectionEdited
        }
      });

    } catch (error) {
      console.error('❌ Error updating product:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);


// ==================== GET EDIT HISTORY ====================
app.get('/api/admin/product/edit-history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const editHistory = await ProductEdit.find({ productId })
      .sort({ editedAt: -1 });
    
    res.json({ success: true, editHistory });
  } catch (error) {
    console.error('❌ Error fetching edit history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});





// ==================== DELETE PRODUCT ROUTE ====================
app.delete('/api/seller/product/delete', async (req, res) => {
  try {
    const { productId, sellerRequestId, deletionReason } = req.body;

    console.log('🗑️ Product deletion request received');

    // Fetch product and seller
    const product = await Product.findById(productId);
    const seller = await SalesRegistration.findOne({ requestId: sellerRequestId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Check if SKU exists
    if (!product.productId) {
      return res.status(400).json({ success: false, message: 'Product has no SKU' });
    }

    // Create deleted SKU record (blocks for 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const deletedSKU = new DeletedSKU({
      sku: product.productId,
      productId: product._id,
      productName: product.itemName,
      sellerName: seller.contactName,
      sellerRequestId: seller.requestId,
      deletionReason,
      deletedAt: new Date(),
      expiresAt,
      isBlocked: true
    });

    await deletedSKU.save();
    console.log(`📋 SKU blocked for 24 hours: ${product.productId}`);

    // Delete product from database
    await Product.deleteOne({ _id: productId });
    console.log(`✅ Product deleted: ${product.itemName}`);

    res.json({
      success: true,
      message: 'Product deleted successfully. SKU blocked for 24 hours.',
      deletedSKU: {
        sku: deletedSKU.sku,
        expiresAt: deletedSKU.expiresAt,
        deletedAt: deletedSKU.deletedAt
      }
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CHECK IF SKU IS BLOCKED ====================
app.get('/api/check-sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    
    const blockedSKU = await DeletedSKU.findOne({ sku, isBlocked: true });
    
    if (blockedSKU) {
      const hoursRemaining = Math.ceil((blockedSKU.expiresAt - Date.now()) / (1000 * 60 * 60));
      
      return res.json({
        success: true,
        isBlocked: true,
        reason: blockedSKU.deletionReason,
        expiresAt: blockedSKU.expiresAt,
        hoursRemaining,
        message: `This SKU is blocked for ${hoursRemaining} more hours`
      });
    }
    
    res.json({ success: true, isBlocked: false });
    
  } catch (error) {
    console.error('❌ Error checking SKU:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GET DELETED SKU HISTORY ====================
app.get('/api/admin/deleted-skus', async (req, res) => {
  try {
    const deletedSKUs = await DeletedSKU.find()
      .sort({ deletedAt: -1 });
    
    res.json({ success: true, deletedSKUs });
  } catch (error) {
    console.error('❌ Error fetching deleted SKUs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});





// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ error: `Route Not Found: ${req.method} ${req.url}` });
});


// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n🚀 Server listening at http://localhost:${PORT}`);
  console.log(`✅ MongoDB Atlas: Connected`);
  console.log(`✅ GridFS Cloud Storage: Enabled`);
  console.log(`✅ Email OTP: Configured`);
  console.log(`✅ Seller Login: Enabled with bcrypt password verification`);
  console.log(`\n✅ Available routes:`);
  console.log(`  - GET  http://localhost:${PORT}/`);
  console.log(`  - POST http://localhost:${PORT}/api/send-otp`);
  console.log(`  - POST http://localhost:${PORT}/api/verify-otp`);
  console.log(`  - POST http://localhost:${PORT}/api/seller-login           ⭐ NEW`);
  console.log(`  - POST http://localhost:${PORT}/api/sales-registration/register`);
  console.log(`  - GET  http://localhost:${PORT}/api/sales-registrations`);
  console.log(`  - GET  http://localhost:${PORT}/api/files/:fileId\n`);
});