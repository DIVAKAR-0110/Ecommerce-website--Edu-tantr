import mongoose from "mongoose";

const uri = "mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0";

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected");

    // Get the database object
    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("📂 Collections in database:");
    collections.forEach(col => console.log(" -", col.name));

    // Truncate each collection (delete all documents)
    for (const col of collections) {
      await db.collection(col.name).deleteMany({});
      console.log(`🗑️  Truncated collection: ${col.name}`);
    }

    console.log("✅ All collections truncated successfully!");
    
    // Close the connection
    await mongoose.connection.close();
    console.log("🔒 MongoDB Connection Closed");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();
