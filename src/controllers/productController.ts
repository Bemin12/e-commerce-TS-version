import path from 'path';
import * as url from 'url';

import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express-serve-static-core';
import sharp from 'sharp';

import Product from '../models/productModel.js';
import * as factory from './handlerFactory.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadMixOfImages } from '../middlewares/uploadImageMiddleware.js';
import APIError from '../utils/apiError.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const uploadProductImages = uploadMixOfImages([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

export const resizeProductImages = asyncHandler(async (req, _res, next) => {
  // console.log(req.files);
  // console.log(req.body);
  const files = req.files as
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | undefined;
  if (!files?.imageCover && !files?.images) return next();

  if (files.imageCover) {
    const filename = `product-${Math.round(Math.random() * 1e9)}-${Date.now()}-cover.jpeg`;

    await sharp(files.imageCover[0]!.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, '..', 'uploads', 'products', filename));

    req.body.imageCover = `/products/${filename}`;
  }

  if (files.images) {
    req.body.images = [];

    await Promise.all(
      files.images.map((image, i) => {
        const filename = `product-${Math.round(Math.random() * 1e9)}-${Date.now()}-${i + 1}.jpeg`;
        sharp(image.buffer)
          .resize(500, 500)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(path.join(__dirname, '..', 'uploads', 'products', filename));

        req.body.images.push(`/products/${filename}`);
      }),
    );
  }

  next();
});

// For nested routes
// GET /api/v1/categories/:categoryId/products
// GET /api/v1/subcategories/:subcategoryId/products
export const createFilterObj = (
  req: Request<{ categoryId?: string; subcategoryId?: string }>,
  _res: Response,
  next: NextFunction,
) => {
  let filterObj = {};
  if (req.params.categoryId)
    filterObj = { category: new mongoose.Types.ObjectId(req.params.categoryId) };
  if (req.params.subcategoryId)
    filterObj = { subcategories: new mongoose.Types.ObjectId(req.params.subcategoryId) };

  req.filterObj = filterObj;
  next();
};

// @desc    Get list of products
// @route   GET /api/v1/products
// @access  Public
export const getProducts = factory.getAll(Product);

// @desc    Get specific product by id
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = factory.getOne(Product);

// @desc    Create product
// @route   POST /api/v1/products
// @access  Protected: Admin, Manager
export const createProduct = factory.createOne(Product);

// @desc    Update specific product
// @route   PATCH /api/v1/products/:id
// @access  Protected: Admin, Manager
export const updateProduct = factory.updateOne(Product);

// @desc    Delete specific product
// @route   DELETE /api/v1/products/:id
// @access  Protected: Admin
export const deleteProduct = factory.deleteOne(Product);

export const addProductVariant = asyncHandler(
  async (
    req: Request<{ id: string }, {}, { color: string; quantity: number }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { id: productId } = req.params;
    const { color, quantity } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $push: { variants: { color, quantity } },
      },
      { new: true },
    );

    if (!product) {
      return next(new APIError('Product not found', 404));
    }

    res.status(200).json({ status: 'success', data: { product } });
  },
);

export const updateProductVariantQuantity = asyncHandler(
  async (
    req: Request<{ id: string; variantId: string }, {}, { quantity: number }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { id: productId, variantId } = req.params;
    const { quantity } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: productId, 'variants._id': variantId },
      { $set: { 'variants.$.quantity': quantity } },
      { new: true },
    );

    if (!product) {
      return next(new APIError('Product or variant not found', 404));
    }

    res.status(200).json({ status: 'success', data: { product } });
  },
);

export const removeProductVariant = asyncHandler(
  async (req: Request<{ id: string; variantId: string }>, res: Response, next: NextFunction) => {
    const { id: productId, variantId } = req.params;

    const product = await Product.findOneAndUpdate(
      { _id: productId, 'variants._id': variantId },
      { $pull: { variants: { _id: variantId } } },
      { new: true },
    );

    if (!product) {
      return next(new APIError('Product or variant not found', 404));
    }

    res.status(200).json({ status: 'success', data: { product } });
  },
);
