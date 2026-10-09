import express from 'express';
import {
  createTeam,
  getTeams,
  getMyTeams,
  getTeamById,
  updateTeam,
  updateTeamMembers
} from '../controllers/teamController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/my-teams', getMyTeams);
router.get('/', authorize('ADMIN', 'HR', 'MANAGER'), getTeams);
router.get('/:id', getTeamById);

router.post('/', authorize('ADMIN', 'HR'), createTeam);
router.put('/:id', authorize('ADMIN', 'HR'), updateTeam);

// Admin, HR, or the specific Team Lead can update members
router.put('/:id/members', updateTeamMembers);

export default router;
