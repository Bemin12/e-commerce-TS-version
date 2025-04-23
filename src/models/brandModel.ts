import mongoose, { Document, Types } from 'mongoose';

export interface IBrand extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  image: string;
  createdAt: Date;
}

const brandSchema = new mongoose.Schema<IBrand>(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      minlength: [3, 'Too short brand name'],
      maxlength: [32, 'Too long brand name'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: String,
  },
  { timestamps: true },
);

export default mongoose.model<IBrand>('Brand', brandSchema);
