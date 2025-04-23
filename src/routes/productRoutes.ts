import express from 'express';
import {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
  getProductReviewsValidator,
} from '../middlewares/validators/productValidator.js';

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  resizeProductImages,
  createFilterObj,
  addProductVariant,
  updateProductVariantQuantity,
  removeProductVariant,
} from '../controllers/productController.js';

import { protect, restrictTo } from '../controllers/authController.js';

import reviewRouter from './reviewRoutes.js';

const router = express.Router({ mergeParams: true });

router.use('/:productId/reviews', getProductReviewsValidator, reviewRouter);

router
  .route('/')
  .get(createFilterObj, getProducts)
  .post(
    protect,
    restrictTo('admin', 'manager'),
    uploadProductImages,
    createProductValidator,
    resizeProductImages,
    createProduct,
  );
router
  .route('/:id')
  .get(getProductValidator, getProduct)
  .patch(
    protect,
    restrictTo('admin', 'manager'),
    uploadProductImages,
    updateProductValidator,
    resizeProductImages,
    updateProduct,
  )
  .delete(protect, restrictTo('admin'), deleteProductValidator, deleteProduct);

router.post('/:id/variants', protect, restrictTo('admin', 'manager'), addProductVariant);
router
  .route('/:id/variants/:variantId')
  .patch(protect, restrictTo('admin', 'manager'), updateProductVariantQuantity)
  .delete(protect, restrictTo('admin', 'manager'), removeProductVariant);

export default router;
