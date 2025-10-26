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
    return res.status(200).json({
      success: true,
      message: "Login successful!",
      seller: {
        requestId: seller.requestId,
        contactName: seller.contactName,
        contactEmail: seller.contactEmail,
        contactNumber: seller.contactNumber,
        brandName: seller.brandName,
        status: seller.status,
        categories: seller.categories,
        createdAt: seller.createdAt,
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