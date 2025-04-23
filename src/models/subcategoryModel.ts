import mongoose, { Document, Types } from 'mongoose';
import { ICategory } from './categoryModel.js';

export interface ISubcategory extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  category: ICategory['_id'];
  createdAt: Date;
}

const subcategorySchema = new mongoose.Schema<ISubcategory>(
  {
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Too short subcategory name'],
      maxlength: [32, 'Too long subcategory name'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Subcategory must belong to parent category'],
    },
  },
  { timestamps: true },
);

export default mongoose.model<ISubcategory>('Subcategory', subcategorySchema);
