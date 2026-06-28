import { Router } from 'express';
import { getUsers, updateUserRole, getStats, createAdmin } from '../controllers/adminController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/users', protect, adminOnly, getUsers);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.get('/stats', protect, adminOnly, getStats);
router.post('/create-admin', createAdmin);

export default router;
