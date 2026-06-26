import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/:itemId', protect, updateCartItem);
router.delete('/:itemId', protect, removeFromCart);
router.delete('/', protect, clearCart);

export default router;
