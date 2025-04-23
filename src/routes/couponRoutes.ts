import express from 'express';
import {
  getCouponValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} from '../middlewares/validators/couponValidator.js';

import {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';

import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use(authController.protect, authController.restrictTo('admin', 'manager'));

router.route('/').get(getCoupons).post(createCouponValidator, createCoupon);
router
  .route('/:id')
  .get(getCouponValidator, getCoupon)
  .patch(updateCouponValidator, updateCoupon)
  .delete(deleteCouponValidator, deleteCoupon);

export default router;
