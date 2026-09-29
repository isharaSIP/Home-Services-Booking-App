const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fixmate";
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.error(`💡 Tip: Update process.env.MONGO_URI in backend/.env with your MongoDB Atlas connection string.`);
  }
};

module.exports = connectDB;