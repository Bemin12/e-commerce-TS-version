import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express-serve-static-core';

import Review from '../models/reviewModel.js';
import * as factory from './handlerFactory.js';

// For nested routes
// POST /api/v1/reviews
// POST /api/v1/products/:productId/reviews
export const setProductUserIdToBody = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.body.user) req.body.user = req.user!._id;
  if (!req.body.product) req.body.product = req.params.productId;

  next();
};

// For nested route
// GET /api/v1/products/:productId/reviews
export const createFilterObj = (
  req: Request<{ productId?: string }>,
  _res: Response,
  next: NextFunction,
) => {
  let filterObj = {};
  if (req.params.productId)
    filterObj = { product: new mongoose.Types.ObjectId(req.params.productId) };
  req.filterObj = filterObj;
  next();
};

// @desc    Get list of reviews
// @route   GET /api/v1/reviews
// @access  Public
export const getReviews = factory.getAll(Review);

// @desc    Get specific review by id
// @route   GET /api/v1/reviews/:id
// @access  Public
export const getReview = factory.getOne(Review);

// @desc    Create review
// @route   POST /api/v1/reviews
// @access  Protected: User
export const createReview = factory.createOne(Review);

// @desc    Update specific review
// @route   PATCH /api/v1/reviews/:id
// @access  Protected: User (owner only)
export const updateReview = factory.updateOne(Review);

// @desc    Delete specific review
// @route   DELETE /api/v1/reviews/:id
// @access  Protected: User (owner only), Admin, Manager
export const deleteReview = factory.deleteOne(Review);
