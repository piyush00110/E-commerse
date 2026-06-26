import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import categoryRoutes from './routes/categories';
import wishlistRoutes from './routes/wishlist';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'ShopSmart E-Commerce API', endpoints: '/api/health' });
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
