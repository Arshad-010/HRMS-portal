import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, server-to-server)
      if (!origin) return callback(null, true);

      // Allow if explicitly configured
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Automatically allow any localhost or 127.0.0.1 port (e.g. 5173, 5174, 3000)
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin);
      if (isLocalhost) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
