import express from 'express';
import {
  getReviewValidator,
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} from '../middlewares/validators/reviewValidator.js';

import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  setProductUserIdToBody,
  createFilterObj,
} from '../controllers/reviewController.js';

import * as authController from '../controllers/authController.js';
import Review from '../models/reviewModel.js';

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(createFilterObj, getReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    setProductUserIdToBody,
    createReviewValidator,
    createReview,
  );
router
  .route('/:id')
  .get(getReviewValidator, getReview)
  .patch(
    authController.protect,
    authController.restrictTo('user'),
    authController.restrictToOwner(Review),
    updateReviewValidator,
    updateReview,
  )
  .delete(
    authController.protect,
    authController.restrictToOwner(Review),
    deleteReviewValidator,
    deleteReview,
  );

export default router;
