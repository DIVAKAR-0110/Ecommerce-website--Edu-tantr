// server.js
import mongoose from "mongoose";

// MongoDB connection URI
const uri = "mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "e-commerce", // Specify the database name here
    });
    console.log("Connected to MongoDB database: e-commerce");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Create a random collection schema
const randomCollectionSchema = new mongoose.Schema({
  name: String,
  value: Number,
  createdAt: { type: Date, default: Date.now },
});

// Generate a random collection name
const collectionName = "collection_" + Math.floor(Math.random() * 1000);

// Create the collection model
const RandomCollection = mongoose.model(collectionName, randomCollectionSchema);

async function createRandomDocument() {
  try {
    const doc = new RandomCollection({
      name: "Random Item",
      value: Math.floor(Math.random() * 1000),
    });

    const savedDoc = await doc.save();
    console.log(`Random document saved in collection ${collectionName}:`, savedDoc);
  } catch (error) {
    console.error("Error creating document:", error);
  }
}

// Run the program
async function main() {
  await connectDB();
  await createRandomDocument();
  mongoose.connection.close();
}

main();
