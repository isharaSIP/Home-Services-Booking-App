const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fixmate";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for admin creation...");

    const adminEmail = "admin@fixmate.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("==========================================");
      console.log("ℹ️ Admin Account already exists:");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔐 Role: ${existingAdmin.role}`);
      console.log("==========================================");
      process.exit(0);
    }

    const admin = await User.create({
      name: "FixMate System Admin",
      email: adminEmail,
      phone: "0770000000",
      password: "adminpassword123",
      role: "admin",
      isVerified: true,
    });

    console.log("==========================================");
    console.log("🎉 SUCCESS: Admin Account Created Successfully!");
    console.log(`👤 Name: ${admin.name}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: adminpassword123`);
    console.log(`🛡️ Role: ${admin.role}`);
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
};

createAdmin();
