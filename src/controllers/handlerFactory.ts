import { Model, Document } from 'mongoose';
import slugify from 'slugify';

import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/apiError.js';
import APIFeatures from '../utils/apiFeatures.js';

const getResourceName = (Model: Model<any>) => Model.modelName.toLowerCase();

// Approach 1 (Mongoose Query) | Two database trips - one for counting documents and other for data |
/*
export const getAll = (Model) =>
  asyncHandler(async (req, res, next) => {
    // Approach 1 (Mongoose Query)
    let filterObj = {};
    if (req.params.categoryId) filterObj = { category: req.params.categoryId };

    const features = new APIFeatures(Model.find(filterObj), req.query)
      .filter()
      .search()
      .sort()
      .limitFields();

    await features.count();
    const { query, paginationResult } = features.paginate(features.count);
    
    const docs = await query;
    const resourceName = `${getResourceName(Model)}s`;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      paginationResult,
      data: { [resourceName]: docs },
    });
  });
*/

// Approach 2 (Aggregation) | One database trip by using $facet stage in aggregation pipeline |
export const getAll = (Model: Model<any>) =>
  asyncHandler(async (req, res, _next) => {
    // let filterObj = {};
    // if (req.params.categoryId)
    //   filterObj = { category: new mongoose.Types.ObjectId(req.params.categoryId) };
    // if (req.params.subcategoryId)
    //   filterObj = { subcategories: new mongoose.Types.ObjectId(req.params.subcategoryId) };
    // if (req.params.productId)
    //   filterObj = { product: new mongoose.Types.ObjectId(req.params.productId) };

    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }

    const features = new APIFeatures(Model.aggregate([{ $match: filter }]), req.query)
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const [{ data: docs, count }] = await features.aggregation;
    const resourceName = `${getResourceName(Model)}s`;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      numOfPages: count[0]?.numOfPages || 0,
      data: { [resourceName]: docs },
    });
  });

export const getOne = (Model: Model<any>) =>
  asyncHandler(async (req, res, next) => {
    // const { query } = new APIFeatures(Model.findById(req.params.id), req.query).limitFields();
    // const doc = await query;

    let query = Model.findById(req.params.id);
    if (req.query?.fields) {
      const fields = (req.query.fields as string).split(',').join(' ');
      query = query.select(fields);
    }
    const doc: Document | null = await query;
    const resourceName = getResourceName(Model);

    if (!doc) {
      return next(new APIError(`No ${resourceName} found with this is`, 404));
    }

    res.status(200).json({ status: 'success', data: { [resourceName]: doc } });
  });

export const createOne = (Model: Model<any>) =>
  asyncHandler(async (req, res, next) => {
    if (req.body.name) req.body.slug = slugify.default(req.body.name, { lower: true });

    const doc: Document = await Model.create(req.body);
    const resourceName = getResourceName(Model);

    res.status(201).json({ status: 'success', [resourceName]: doc });
  });

export const updateOne = (Model: Model<any>) =>
  asyncHandler(async (req, res, next) => {
    if (req.body.name) req.body.slug = slugify.default(req.body.name, { lower: true });
    // console.log(req.body);
    const doc: Document | null = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    const resourceName = getResourceName(Model);

    if (!doc) {
      return next(new APIError(`No ${resourceName} found with this is`, 404));
    }

    res.status(200).json({ status: 'success', data: { [resourceName]: doc } });
  });

export const deleteOne = (Model: Model<any>) =>
  asyncHandler(async (req, res, next) => {
    const doc: Document | null = await Model.findByIdAndDelete(req.params.id);
    const resourceName = getResourceName(Model);

    if (!doc) {
      return next(new APIError(`No ${resourceName} found with this is`, 404));
    }

    res.status(204).send();
  });
