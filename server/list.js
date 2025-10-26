// conn.js
import mongoose from "mongoose";

// MongoDB connection URI
const uri = "mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(uri, {
      dbName: "e-commerce", // specify your database
    });
    console.log("Connected to MongoDB database: e-commerce");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

async function listAllCollectionsAndDocuments() {
  try {
    // Get native MongoDB database object
    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("Collections in e-commerce database:");
    collections.forEach(col => console.log(`- ${col.name}`));

    console.log("\nListing all documents from each collection:\n");

    // Iterate over each collection and fetch documents
    for (const col of collections) {
      const documents = await db.collection(col.name).find({}).toArray();
      console.log(`Collection: ${col.name}`);
      if (documents.length === 0) {
        console.log("  No documents found.\n");
      } else {
        documents.forEach((doc, index) => {
          console.log(`  Document ${index + 1}:`, doc);
        });
        console.log("\n");
      }
    }
  } catch (error) {
    console.error("Error fetching collections/documents:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the program
async function main() {
  await connectDB();
  await listAllCollectionsAndDocuments();
}

main();

