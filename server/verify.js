// emailVerification.js - Standalone Email Verification Server
import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import cors from "cors";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store OTPs temporarily (use Redis or database in production)
const otpStore = new Map();

const EMAIL_HOST_USER = "ungaarusuvai1709@gmail.com";
const EMAIL_HOST_PASSWORD = "yzaw hnbt rnrz fujs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_HOST_USER,
    pass: EMAIL_HOST_PASSWORD,
  },
});

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Test route
app.get("/", (req, res) => {
  res.json({ 
    message: "Email Verification Server is running!",
    endpoints: ["/api/send-otp", "/api/verify-otp"]
  });
});

// API Route: Send OTP
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email address" 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });

    // Email content
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

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`✓ OTP sent to ${email}: ${otp}`); // Remove in production

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });

  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
      error: error.message
    });
  }
});

// API Route: Verify OTP
app.post("/api/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Check if OTP exists
    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this email. Please request a new one.",
      });
    }

    // Check expiration
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Check attempts (max 3 attempts)
    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "Maximum attempts exceeded. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (storedData.otp === otp.trim()) {
      otpStore.delete(email); // Remove OTP after successful verification
      return res.status(200).json({
        success: true,
        message: "Email verified successfully!",
      });
    } else {
      // Increment attempts
      storedData.attempts += 1;
      otpStore.set(email, storedData);

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`,
      });
    }

  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n✓ Email Verification Server is running on http://localhost:${PORT}`);
  console.log(`✓ Available endpoints:`);
  console.log(`  - GET  http://localhost:${PORT}/`);
  console.log(`  - POST http://localhost:${PORT}/api/send-otp`);
  console.log(`  - POST http://localhost:${PORT}/api/verify-otp\n`);
});
