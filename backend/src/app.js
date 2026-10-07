import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Development Logging Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const logMessage = `${req.method} ${req.originalUrl} ${status} - ${duration}ms`;
      
      // Simple color coding for development
      if (status >= 500) {
        console.error(`\x1b[31m${logMessage}\x1b[0m`); // Red
      } else if (status >= 400) {
        console.warn(`\x1b[33m${logMessage}\x1b[0m`); // Yellow
      } else {
        console.log(`\x1b[36m${logMessage}\x1b[0m`); // Cyan
      }
    });
    next();
  });
}

// Root health ping
app.get('/', (req, res) => {
  res.json({
    name: 'HRMS Portal API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
