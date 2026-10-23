/**
 * Zomato Clone — Express Server Entry Point
 * 
 * Initializes Express with middleware, connects to MongoDB,
 * and starts the HTTP server.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import http from 'http';
import { initSockets } from './sockets/socketHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(helmet());             // Security headers
app.use(cors());               // CORS for mobile app
app.use(compression());        // Gzip compression
app.use(express.json());       // JSON body parser
app.use(express.urlencoded({ extended: true }));

// Request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Increased for dev testing
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});
app.use('/api/', limiter);

// Strict rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Increased for dev testing
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  }
});
app.use('/api/v1/auth/', authLimiter);

// ── Routes ──

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/partner', partnerRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zomato Clone API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// ── Start Server ──
const startServer = async () => {
  await connectDB();

  // Auto-seed when using in-memory DB (data is lost on restart)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { seedData } = await import('./seed/seedDatabase.js');
      await seedData();
      
      // ONE-TIME FIX FOR TAXES
      const Order = (await import('./models/Order.js')).default;
      const orders = await Order.find({ status: 'DELIVERED' });
      for (let o of orders) {
         // subtract taxes if they were incorrectly included in zomatoRevenue
         // Let's just cleanly recalculate it for all delivered orders based on the new exact formula:
         const p = o.pricing;
         const newZomatoRevenue = (p.zomatoCommission || 0) + (p.platformFee || 0) + ((p.deliveryFee || 0) - (p.deliveryPayout || 0)) - (p.zomatoAbsorbedDiscount || 0) + (p.previousCancellationPenalty || 0);
         o.pricing.zomatoRevenue = newZomatoRevenue;
         await o.save();
      }
      console.log('✅ Backfilled old orders to remove taxes from Zomato Revenue!');
    } catch (err) {
      console.warn('⚠️ Auto-seed skipped:', err.message);
    }
  }

  const httpServer = http.createServer(app);
  initSockets(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Zomato Clone Server running on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔑 Phone hash pepper: ${process.env.PHONE_HASH_PEPPER ? '✅ Configured' : '❌ NOT SET'}`);
    console.log(`\n📋 API Endpoints:`);
    console.log(`   POST   /api/v1/auth/send-otp`);
    console.log(`   POST   /api/v1/auth/verify-otp`);
    console.log(`   GET    /api/v1/restaurants/nearby?lat=17.385&lng=78.4867`);
    console.log(`   GET    /api/v1/restaurants/:slug/menu`);
    console.log(`   GET    /health\n`);
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  const { disconnectDB } = await import('./config/database.js');
  await disconnectDB();
  process.exit(0);
});

startServer();

export default app;
