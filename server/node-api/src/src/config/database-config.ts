import mongoose, { ConnectOptions } from "mongoose";

const connectDB = async () => {
  try {
    // Define MongoDB URL with a fallback
    const mongoUrl = process.env.MONGODB_URI;

    // Add strict type checking for the URL
    if (!mongoUrl) {
      throw new Error('MongoDB URI is not defined');
    }

    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);

    console.log("Database is connected");
  } catch (error) {
    // Improved error handling with type safety
    if (error instanceof Error) {
      console.log("MongoDB connection error:", error.message);
    } else {
      console.log("An unknown error occurred");
    }
    process.exit(1); // Exit process on connection failure
  }
};

export default connectDB;