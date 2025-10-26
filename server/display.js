// salesFetchServer.js - Simplified Server with Fixed Image URLs
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors({ origin: "*" }));
app.use(express.json());

// IMPORTANT: Serve the uploads folder from your main server location
const UPLOADS_PATH = "D:\\edu_proj\\my-react-app\\server\\uploads";
app.use('/uploads', express.static('E:\\edu_proj\\my-react-app\\server\\uploads'));

console.log(`📁 Serving files from: ${UPLOADS_PATH}`);

// --- MongoDB Connection ---
const MONGODB_URI = "mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log("📂 Database: e-commerce");
    console.log("📋 Collection: salesregistrations");
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
  });

// --- Mongoose Schema ---
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
  gstCertificatePath: String, 
  brandName: { type: String, required: true },
  manufacturerName: String, 
  trademarkNumber: String, 
  trademarkFilePath: String,
  brandLogoPath: String, 
  authorizationLetterPath: String, 
  accountNumber: String,
  ifsc: String, 
  bankType: String, 
  shippingAddress: { type: String, required: true },
  digitalSignaturePath: { type: String, required: true },
  password: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

const SalesRegistration = mongoose.model("SalesRegistration", salesRegistrationSchema);

// Helper to convert Windows path to URL
const convertPathToUrl = (filePath) => {
  if (!filePath) return null;
  
  try {
    // Extract just the filename and folder
    const filename = path.basename(filePath);
    const folder = path.basename(path.dirname(filePath));
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error("Path conversion error:", error);
    return null;
  }
};

// ========================================
// API ROUTES
// ========================================

// Get All Registrations
app.get("/api/sales-registrations", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { requestId: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { contactEmail: { $regex: search, $options: "i" } },
        { brandName: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const registrations = await SalesRegistration.find(filter)
      .select("-password")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add URL conversions
    const registrationsWithUrls = registrations.map(reg => ({
      ...reg,
      gstCertificateUrl: convertPathToUrl(reg.gstCertificatePath),
      trademarkFileUrl: convertPathToUrl(reg.trademarkFilePath),
      brandLogoUrl: convertPathToUrl(reg.brandLogoPath),
      authorizationLetterUrl: convertPathToUrl(reg.authorizationLetterPath),
      digitalSignatureUrl: convertPathToUrl(reg.digitalSignaturePath)
    }));

    const totalCount = await SalesRegistration.countDocuments(filter);

    console.log(`✓ Fetched ${registrations.length} registrations (Page ${page})`);

    res.status(200).json({
      success: true,
      data: registrationsWithUrls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalRecords: totalCount,
        recordsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
      error: error.message
    });
  }
});

// Get Single Registration
app.get("/api/sales-registrations/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const registration = await SalesRegistration.findOne({ requestId })
      .select("-password")
      .lean();

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `Registration with ID ${requestId} not found`
      });
    }

    const registrationWithUrls = {
      ...registration,
      gstCertificateUrl: convertPathToUrl(registration.gstCertificatePath),
      trademarkFileUrl: convertPathToUrl(registration.trademarkFilePath),
      brandLogoUrl: convertPathToUrl(registration.brandLogoPath),
      authorizationLetterUrl: convertPathToUrl(registration.authorizationLetterPath),
      digitalSignatureUrl: convertPathToUrl(registration.digitalSignaturePath)
    };

    console.log(`✓ Fetched: ${requestId}`);

    res.status(200).json({
      success: true,
      data: registrationWithUrls
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registration",
      error: error.message
    });
  }
});

// Get Statistics
app.get("/api/stats", async (req, res) => {
  try {
    const total = await SalesRegistration.countDocuments();
    const pending = await SalesRegistration.countDocuments({ status: "pending" });
    const approved = await SalesRegistration.countDocuments({ status: "approved" });
    const rejected = await SalesRegistration.countDocuments({ status: "rejected" });
    const emailVerified = await SalesRegistration.countDocuments({ emailVerified: true });

    res.status(200).json({
      success: true,
      stats: { total, pending, approved, rejected, emailVerified }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Status
app.patch("/api/sales-registrations/:requestId/status", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const registration = await SalesRegistration.findOneAndUpdate(
      { requestId },
      { status },
      { new: true }
    ).select("-password");

    if (!registration) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: registration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Root
app.get("/", (req, res) => {
  res.json({
    status: "✅ Server Online",
    database: "e-commerce",
    collection: "salesregistrations",
    uploadsPath: UPLOADS_PATH,
    endpoints: [
      "GET  /api/sales-registrations",
      "GET  /api/sales-registrations/:requestId",
      "GET  /api/stats",
      "PATCH /api/sales-registrations/:requestId/status",
      "GET  /uploads/* - Access files"
    ]
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Files available at http://localhost:${PORT}/uploads/`);
  console.log(`✅ Ready to serve data\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
