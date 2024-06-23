const mongoose = require("mongoose");
const dotenv = require("dotenv");
// dotenv.config({ path: ".env" });
dotenv.config({path:__dirname+'/.env'});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/chatapp', {
      dbName: "chatapp",
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
