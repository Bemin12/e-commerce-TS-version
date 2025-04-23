import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express-serve-static-core';

import Subcategory from '../models/subcategoryModel.js';
import * as factory from './handlerFactory.js';

// For nested route
// POST /api/v1/categories/:categoryId/subcategories
export const setCategoryIdToBody = (
  req: Request<{ categoryId?: string }, {}, { category?: string }>,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

// For nested route
// GET /api/v1/categories/:categoryId/subcategories
export const createFilterObj = (
  req: Request<{ categoryId?: string }>,
  _res: Response,
  next: NextFunction,
) => {
  let filterObj = {};
  if (req.params.categoryId)
    filterObj = { category: new mongoose.Types.ObjectId(req.params.categoryId) };

  req.filterObj = filterObj;
  next();
};

// @desc    Get list of subcategories
// @route   GET /api/v1/subcategories
// @access  Public
export const getSubcategories = factory.getAll(Subcategory);

// @desc    Get specific subcategory by id
// @route   GET /api/v1/subcategories/:id
// @access  Public
export const getSubcategory = factory.getOne(Subcategory);

// Nested route
// POST /api/v1/categories/:categoryId/subcategories

// @desc    Create subcategory
// @route   POST /api/v1/subcategories
// @access  Protected: Admin, Manager
export const createSubcategory = factory.createOne(Subcategory);

// @desc    Update specific subcategory
// @route   PATCH /api/v1/subcategories/:id
// @access  Protected: Admin, Manager
export const updateSubcategory = factory.updateOne(Subcategory);

// @desc    Delete specific subcategory
// @route   DELETE /api/v1/subcategories/:id
// @access  Protected: Admin
export const deleteSubcategory = factory.deleteOne(Subcategory);
