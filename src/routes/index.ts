import { Express } from 'express';

import categoryRouter from './categoryRoutes.js';
import subcategoryRouter from './subcategoryRoutes.js';
import brandRouter from './brandRoutes.js';
import productRouter from './productRoutes.js';
import userRouter from './userRoutes.js';
import authRouter from './authRoutes.js';
import reviewRouter from './reviewRoutes.js';
import wishlistRouter from './wishlistRoutes.js';
import addressRouter from './addressRoutes.js';
import couponRouter from './couponRoutes.js';
import cartRouter from './cartRoutes.js';
import orderRouter from './orderRoutes.js';

const mountRoutes = (app: Express) => {
  app.use('/api/v1/categories', categoryRouter);
  app.use('/api/v1/subcategories', subcategoryRouter);
  app.use('/api/v1/brands', brandRouter);
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/v1/wishlist', wishlistRouter);
  app.use('/api/v1/addresses', addressRouter);
  app.use('/api/v1/coupons', couponRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/orders', orderRouter);
};

export default mountRoutes;
