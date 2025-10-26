import { MongoClient } from "mongodb";

const uri = "mongodb+srv://Aani:aanirudh__02@cluster0.akxge8k.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected successfully to MongoDB!");

    const db = client.db("test");

    // Create a collection and insert one record (if it doesn't exist)
    const result = await db.collection("users").insertOne({ name: "Aanirudh", role: "admin" });
    console.log("📥 Document inserted with _id:", result.insertedId);

    // List all databases in the cluster
    const databases = await client.db().admin().listDatabases();
    console.log("📚 Databases:");
    databases.databases.forEach(db => console.log(` - ${db.name}`));

  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.close();
  }
}

connectDB(); 