import mongoose from "mongoose";

// MongoDB Connection URI
const MONGO_URI = "mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0";

// Email to approve
const EMAIL_TO_APPROVE = "karna02@gmail.com";

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully\n");

    // Define Schema (minimal - only fields we need)
    const salesRegistrationSchema = new mongoose.Schema({
      requestId: String,
      contactName: String,
      contactEmail: String,
      status: String,
    }, { timestamps: true });

    // Create Model
    const SalesRegistration = mongoose.model("SalesRegistration", salesRegistrationSchema);

    console.log("=".repeat(70));
    console.log("🔍 UPDATING SELLER STATUS");
    console.log("=".repeat(70));
    console.log(`📧 Email: ${EMAIL_TO_APPROVE}`);
    console.log(`🎯 Target Status: approved`);
    console.log("=".repeat(70) + "\n");

    // First, check if seller exists
    const seller = await SalesRegistration.findOne({ contactEmail: EMAIL_TO_APPROVE });

    if (!seller) {
      console.log(`❌ ERROR: No seller found with email: ${EMAIL_TO_APPROVE}`);
      console.log("Please check the email address and try again.\n");
      mongoose.connection.close();
      return;
    }

    console.log("📊 CURRENT SELLER INFORMATION:");
    console.log("=".repeat(70));
    console.log(`👤 Name: ${seller.contactName}`);
    console.log(`🆔 Request ID: ${seller.requestId}`);
    console.log(`📧 Email: ${seller.contactEmail}`);
    console.log(`📊 Current Status: ${seller.status}`);
    console.log("=".repeat(70) + "\n");

    // Check if already approved
    if (seller.status === "approved") {
      console.log("✅ ALREADY APPROVED!");
      console.log("This account is already approved. No changes needed.\n");
      mongoose.connection.close();
      return;
    }

    // Update status to approved
    seller.status = "approved";
    await seller.save();

    console.log("🔄 STATUS UPDATED SUCCESSFULLY!");
    console.log("📊 UPDATED SELLER INFORMATION:");
    console.log("=".repeat(70));
    console.log(`👤 Name: ${seller.contactName}`);
    console.log(`🆔 Request ID: ${seller.requestId}`);
    console.log(`📧 Email: ${seller.contactEmail}`);
    console.log(`📊 New Status: ${seller.status}`);
    console.log("=".repeat(70) + "\n");

    mongoose.connection.close();
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    mongoose.connection.close();
  });
