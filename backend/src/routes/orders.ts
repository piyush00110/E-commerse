import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  payOrder,
} from '../controllers/orderController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/all', protect, adminOnly, getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/pay', protect, payOrder);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
