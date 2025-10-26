import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import bcrypt from "bcryptjs";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// --- Middleware ---
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Database Connection ---
mongoose.connect("mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- Mongoose Schema ---
const salesRegistrationSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  categories: [String], customCategory: String, retailPlatform: String,
  platformStoreLink: String, platformTimePeriod: String, retailDetails: String,
  retailDetailsLink: String, totalTime: String, referenceLink: String,
  socialPlatforms: [String], instagramLink: String, whatsappContact: String,
  facebookLink: String, twitterLink: String, telegramLink: String,
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactNumber: { type: String, required: true },
  contactDesignation: String, emailVerified: { type: Boolean, default: false },
  gstType: { type: String, required: true }, gstNumber: String, gstName: String,
  gstAddress: String, panNumber: { type: String, required: true },
  gstCertificatePath: String, brandName: { type: String, required: true },
  manufacturerName: String, trademarkNumber: String, trademarkFilePath: String,
  brandLogoPath: String, authorizationLetterPath: String, accountNumber: String,
  ifsc: String, bankType: String, shippingAddress: { type: String, required: true },
  digitalSignaturePath: { type: String, required: true },
  password: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

const SalesRegistration = mongoose.model("SalesRegistration", salesRegistrationSchema);

// --- File Upload Setup ---
const uploadBasePath = path.join(__dirname, "uploads");
["gst-certificates", "trademark-certificates", "brand-logos", "authorization-letters", "digital-signatures"].forEach(dir => {
  const dirPath = path.join(uploadBasePath, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderMap = {
      gstCertificate: "gst-certificates",
      trademarkFile: "trademark-certificates",
      brandLogo: "brand-logos",
      authorizationLetter: "authorization-letters",
      digitalSignature: "digital-signatures"
    };
    cb(null, path.join(uploadBasePath, folderMap[file.fieldname] || ""));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });


// --- ROUTES ---

// Test Route
app.get("/", (req, res) => {
  res.json({ status: "Server is online and running." });
});

// Main POST Route
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
      const registrationData = new SalesRegistration({
        ...req.body,
        categories: JSON.parse(req.body.categories || "[]"),
        socialPlatforms: JSON.parse(req.body.socialPlatforms || "[]"),
        emailVerified: req.body.emailVerified === "true",
        gstCertificatePath: req.files?.gstCertificate?.[0]?.path || null,
        trademarkFilePath: req.files?.trademarkFile?.[0]?.path || null,
        brandLogoPath: req.files?.brandLogo?.[0]?.path || null,
        authorizationLetterPath: req.files?.authorizationLetter?.[0]?.path || null,
        digitalSignaturePath: req.files?.digitalSignature?.[0]?.path,
        password: await bcrypt.hash(req.body.password, 10)
      });

      await registrationData.save();
      console.log(`✅ Data saved for Request ID: ${registrationData.requestId}`);
      res.status(201).json({ success: true, requestId: registrationData.requestId });
    } catch (error) {
      console.error("❌ Database or Logic Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 404 Handler (must be last)
app.use((req, res) => {
  res.status(404).json({ error: `Route Not Found: ${req.method} ${req.url}` });
});


// --- Start Server ---
app.listen(3000, () => {
  console.log(`\n🚀 Server listening at http://localhost:3000`);
});
