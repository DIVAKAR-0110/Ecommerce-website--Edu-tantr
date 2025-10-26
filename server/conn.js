// filename: conn.js
import mongoose from "mongoose";

const uri = "mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

connectDB();
