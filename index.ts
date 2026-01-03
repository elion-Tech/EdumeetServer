
import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import router from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors() as any);
app.use(express.json() as any);

// Health Check for Render zero-downtime deploys
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date(), environment: process.env.NODE_ENV || 'development' }));

// Register API Routes
app.use('/api', router);

// Database Connection - Using provided Atlas URI with environment variable fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://elion:edumeet@cluster0.vaixme5.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Production Database Connected: MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Edumeet Server v1.0 running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/health`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });
