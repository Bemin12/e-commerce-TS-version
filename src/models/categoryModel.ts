import mongoose, { Document, Types } from 'mongoose';

export interface ICategory extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  image: string;
  createdAt: string;
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      minlength: [3, 'Too short category name'],
      maxlength: [32, 'Too long category name'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      type: String,
      // get: (val) => `${process.env.BASE_URL}${val}`,
    },
  },
  { timestamps: true },
  // { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } },
);

export default mongoose.model<ICategory>('Category', categorySchema);
