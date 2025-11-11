/* eslint-disable no-unused-vars */
// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

import multer from "multer";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// ✅ MongoDB connection (change DB name)
mongoose
  .connect("mongodb://127.0.0.1:27017/profileDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected ✔"))
  .catch((err) => console.log(err));

// ✅ Schema
const profileSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  image: String, // base64 image
});

const Profile = mongoose.model("Profile", profileSchema);


app.post("/api/profiles", async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json({ message: "Profile created", profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/profiles", async (req, res) => {
  const profiles = await Profile.find();
  res.json(profiles);
});


app.get("/api/profiles/:id", async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ error: "Not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/api/profiles/:id", async (req, res) => {
  try {
    const updated = await Profile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ message: "Updated successfully", updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/profiles/:id", async (req, res) => {
  try {
    await Profile.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Server start
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
