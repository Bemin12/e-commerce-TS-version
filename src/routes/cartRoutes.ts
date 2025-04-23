import express from 'express';
import {
  addProductToCartValidator,
  removeSpecificCartItemValidator,
  updateCartItemQuantityValidator,
} from '../middlewares/validators/cartValidator.js';

import {
  addProductToCart,
  getCurrentUserCart,
  removeSpecifCartItem,
  clearCart,
  updateCartItemQuantity,
  applyCoupon,
} from '../controllers/cartController.js';

import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use(authController.protect, authController.restrictTo('user'));

router
  .route('/')
  .get(getCurrentUserCart)
  .post(addProductToCartValidator, addProductToCart)
  .delete(clearCart);
router.patch('/applyCoupon', applyCoupon);
router
  .route('/:itemId')
  .delete(removeSpecificCartItemValidator, removeSpecifCartItem)
  .patch(updateCartItemQuantityValidator, updateCartItemQuantity);

export default router;
