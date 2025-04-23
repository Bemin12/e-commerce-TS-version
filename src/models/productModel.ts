import mongoose, { Document, Types, Query } from 'mongoose';

import { IBrand } from './brandModel.js';
import { ICategory } from './categoryModel.js';
import { ISubcategory } from './subcategoryModel.js';

export interface IProduct extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  description: string;
  quantity: number;
  sold: number;
  price: number;
  priceAfterDiscount?: number;
  variants: { color: string; quantity: number }[];
  imageCover: string;
  images: string[];
  category: ICategory['_id'];
  subcategories: ISubcategory['_id'][];
  brand: IBrand['_id'];
  ratingsAverage: number;
  ratingsQuantity: number;
  createdAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      minlength: [3, 'Too short product name'],
      maxlength: [100, 'Too long product name'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [20, 'Too short product description'],
    },
    quantity: {
      type: Number,
      required: [true, 'Product quantity is required'],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be a positive number'],
    },
    priceAfterDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price {{VALUE}} should be below regular price',
      },
    },
    variants: [
      {
        color: String,
        quantity: {
          type: Number,
          required: [true, 'Product quantity is required'],
        },
      },
    ],
    imageCover: {
      type: String,
      required: [true, 'Product image cover is required'],
    },
    images: [String],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to category'],
    },
    subcategories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Subcategory',
      },
    ],
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: 'Brand',
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be above or equal to 1'],
      max: [5, 'Rating must be below or equal to 5'],
      set: (val: number) => Math.floor(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// productSchema.pre('save', function () {
//   this.slug = slugify(this.name, { lower: true });
// });

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  options: {
    sort: '-createdAt',
    limit: 10,
  },
});

// Populate the populated virtual 'reviews' property
productSchema.pre<Query<any, IProduct>>(/^findOne/, function (next) {
  this.populate('reviews');
  next();
});

productSchema.pre<Query<any, IProduct>>(/^find/, function (next) {
  if (this.getOptions().skipPopulation) return next(); // used in getCurrentUserCart when populating the product to skip populating the category

  this.populate('category', 'name -_id');
  next();
});

// To get category details upon get all products request
productSchema.pre('aggregate', function (next) {
  // Skip getting category details if products were requested for specific category
  if ((this.pipeline()[0] as any)?.$match?.category) return next();

  this.pipeline().splice(
    -2,
    0,
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'category',
      },
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    },
  );
  next();
});

export default mongoose.model<IProduct>('Product', productSchema);
