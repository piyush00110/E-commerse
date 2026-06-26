import express from 'express';
import cors from 'cors';
import { errorHandler } from '../src/middleware/errorHandler';
import authRoutes from '../src/routes/auth';
import productRoutes from '../src/routes/products';
import cartRoutes from '../src/routes/cart';
import orderRoutes from '../src/routes/orders';
import categoryRoutes from '../src/routes/categories';
import wishlistRoutes from '../src/routes/wishlist';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'ShopSmart E-Commerce API' });
});

app.get('/api', (_req, res) => {
  res.redirect('/api/health');
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'E-Commerce API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.use(errorHandler);

export default app;
