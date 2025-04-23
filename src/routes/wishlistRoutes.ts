import express from 'express';
import {
  addProductToWishlistValidator,
  removeProductFromWishlistValidator,
} from '../middlewares/validators/wishlistValidator.js';

import {
  addProductToWishlist,
  removeProductFromWishlist,
  getCurrentUserWishlist,
} from '../controllers/wishlistController.js';

import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use(authController.protect, authController.restrictTo('user'));

router
  .route('/')
  .get(getCurrentUserWishlist)
  .post(addProductToWishlistValidator, addProductToWishlist);

router.delete('/:productId', removeProductFromWishlistValidator, removeProductFromWishlist);

export default router;
