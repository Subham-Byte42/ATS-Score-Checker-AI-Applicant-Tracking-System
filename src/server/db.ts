import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI environment variable is not defined.');
    console.warn('ℹ️ Operating in fallback demo mode. Set MONGODB_URI to connect a MongoDB database.');
    return;
  }

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // Prevent uncaught background errors from crashing the Node process
  mongoose.connection.on('error', (err) => {
    console.error('⚠️ MongoDB Connection runtime error:', err.message || err);
  });

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5s timeout instead of default 30s
    });
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error: any) {
    console.error('❌ MongoDB Connection Failure:');
    if (error.name === 'MongooseServerSelectionError') {
      console.error('   Reason: Could not select MongoDB server. Common cause: IP Whitelist on MongoDB Atlas.');
      console.error('   Fix: In MongoDB Atlas -> Network Access, add IP "0.0.0.0/0" (Allow access from anywhere).');
    } else {
      console.error('  ', error.message || error);
    }
    console.warn('ℹ️ Falling back to in-memory demo mode for auth APIs.');
  }
};
