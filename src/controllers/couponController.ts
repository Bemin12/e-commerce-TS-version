import * as factory from './handlerFactory.js';
import Coupon from '../models/couponModel.js';

// @desc    Get list of Coupons
// @route   GET /api/v1/coupons
// @access  Protected: Admin, Manager
export const getCoupons = factory.getAll(Coupon);

// @desc    Get specific Coupon by id
// @route   GET /api/v1/coupons/:id
// @access  Protected: Admin, Manager
export const getCoupon = factory.getOne(Coupon);

// @desc    Create Coupon
// @route   POST /api/v1/coupons
// @access  Protected: Admin, Manager
export const createCoupon = factory.createOne(Coupon);

// @desc    Update specific Coupon
// @route   PATCH /api/v1/coupons/:id
// @access  Protected: Admin, Manager
export const updateCoupon = factory.updateOne(Coupon);

// @desc    Delete specific Coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Protected: Admin
export const deleteCoupon = factory.deleteOne(Coupon);
