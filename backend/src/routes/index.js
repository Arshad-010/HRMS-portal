import express from 'express';
import healthRoutes from './healthRoutes.js';

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);

export default router;
