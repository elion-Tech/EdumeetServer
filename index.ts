
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

// 404 Handler - Returns JSON instead of HTML for missing routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global Error Handler - Catches errors and returns JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Database Connection - Using provided Atlas URI with environment variable fallback
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGO_URI environment variable is not defined.");
  process.exit(1);
}

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
