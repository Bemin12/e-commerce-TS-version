import mongoose, { Document, Types } from 'mongoose';
import { IProduct } from './productModel.js';
import { IUser } from './userModel.js';

export interface IOrderItem {
  product: IProduct['_id'];
  name: string;
  price: number;
  quantity: number;
  color: string;
}

export interface IOrder extends Document<Types.ObjectId> {
  user: IUser['_id'];
  orderItems: IOrderItem[];
  taxPrice: number;
  shippingPrice: number;
  shippingAddress: string;
  totalPrice: number;
  paymentMethod: 'card' | 'cash';
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  createdAt: Date;
}

const orderItemSchema = new mongoose.Schema<IOrderItem>({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'Product id is required'],
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
  },
  price: Number,
  quantity: {
    type: Number,
    min: [1, 'quantity must be a positive number'],
  },
  color: String,
});

const orderSchema = new mongoose.Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    orderItems: [orderItemSchema],
    taxPrice: {
      type: Number,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      default: 0,
    },
    shippingAddress: {
      details: String,
      phone: String,
      city: String,
      postalCode: String,
    },
    totalPrice: Number,
    paymentMethod: {
      type: String,
      enum: ['card', 'cash'],
      default: 'cash',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
  },
  { timestamps: true },
);

// To get users data upon get all orders request for admins
orderSchema.pre('aggregate', function (next) {
  // Skip getting user data if orders were requested for specific user
  if ((this.pipeline()[0] as any)?.$match?.user) return next();

  this.pipeline().splice(
    -2,
    0,
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              name: 1,
              email: 1,
            },
          },
        ],
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
  );

  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
