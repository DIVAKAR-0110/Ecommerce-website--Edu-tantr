import bcrypt from "bcryptjs";

const plainPassword = "YOUR_ACTUAL_PASSWORD_HERE"; // Put your actual password
const storedHash = "$2b$10$shpA4hXoO3d0qWFlroD9ZeHR1Lx68Trqn9IY9H6eVw.GISE84JG5.";

console.log("Testing password hash...");
console.log("Plain password:", plainPassword);
console.log("Stored hash:", storedHash);
console.log("Plain password length:", plainPassword.length);

bcrypt.compare(plainPassword, storedHash)
  .then(result => {
    console.log("\n✅ Result:", result);
    if (result) {
      console.log("✅ PASSWORD MATCHES!");
    } else {
      console.log("❌ PASSWORD DOES NOT MATCH");
      
      // Generate new hash to test
      return bcrypt.hash(plainPassword, 10);
    }
  })
  .then(newHash => {
    if (newHash) {
      console.log("\n🆕 New hash generated:", newHash);
      return bcrypt.compare(plainPassword, newHash);
    }
  })
  .then(newResult => {
    if (newResult !== undefined) {
      console.log("✅ New hash verification:", newResult);
    }
  })
  .catch(err => {
    console.error("❌ Error:", err);
  });
