import express from 'express';

import Order from '../models/orderModel.js';

import {
  createCashOrder,
  getOrders,
  getOrder,
  createFilterObject,
  updateOrderStatus,
  getCheckoutSession,
  cancelCashOrder,
} from '../controllers/orderController.js';

import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(createFilterObject, getOrders)
  .post(authController.restrictTo('user'), createCashOrder);

router.get('/checkout-session', getCheckoutSession);

router
  .route('/:id')
  .get(authController.restrictToOwner(Order), getOrder)
  .delete(authController.restrictToOwner(Order), cancelCashOrder);

router.patch('/:id/status', authController.restrictTo('admin', 'manager'), updateOrderStatus);

export default router;
