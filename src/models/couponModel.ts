import mongoose from 'mongoose';

export interface ICoupon {
  name: string;
  expireAt: Date;
  discount: number;
  createdAt: Date;
}

const couponSchema = new mongoose.Schema<ICoupon>(
  {
    name: {
      type: String,
      required: [true, 'Coupon name is required'],
      trim: true,
      unique: true,
      minlength: [3, 'Coupon name is too short'],
      maxlength: [20, 'Coupon name is too long'],
      uppercase: true,
    },
    expireAt: {
      type: Date,
      required: [true, 'Coupon expire time is required'],
      validate: {
        validator: (val) => new Date(val) > new Date(),
        message: 'Expire date must be in the future',
      },
    },
    discount: {
      type: Number,
      required: [true, 'Coupon discount value is required'],
      min: [0, 'Discount value must be greater than or equal to 0'],
      max: [100, 'Discount value must be less than or equal to 100'],
    },
  },
  { timestamps: true },
);

export default mongoose.model<ICoupon>('Coupon', couponSchema);
