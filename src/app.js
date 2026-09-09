import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import apiRouter from './routes/index.js';

const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and specified client origin
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === ENV.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, configurable for production
      }
    },
    credentials: true,
  })
);

// HTTP request logging
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
app.use(globalRateLimiter);

// API Base Route
app.use('/api/v1', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Toy Store REST API',
    version: '1.0.0',
    docs: '/api/v1/health',
  });
});

// 404 and Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
