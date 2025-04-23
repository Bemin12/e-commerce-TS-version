import mongoose, { Model, Document, Types, Query } from 'mongoose';
import Product, { IProduct } from './productModel.js';
import { IUser } from './userModel.js';

interface IReview extends Document<Types.ObjectId> {
  review: string;
  rating: number;
  user: IUser['_id'];
  product: IProduct['_id'];
  createdAt: Date;
}

interface ReviewModel extends Model<IReview> {
  calculateAverageRating(productId: Types.ObjectId): Promise<void>;
}

const reviewSchema = new mongoose.Schema<IReview, ReviewModel>(
  {
    review: String,
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be above or equal to 1'],
      max: [5, 'Rating must be below or equal to 5'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
    },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.pre<Query<any, any>>(/^find/, function (next) {
  if (this.getOptions().skipPopulation) return next();

  this.populate('user', 'name profileImg');
  next();
});

reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: null,
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  console.log(stats);
  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: stats[0]?.avgRating || 0,
    ratingsQuantity: stats[0]?.nRating || 0,
  });
};

reviewSchema.post('save', async function () {
  await (this.constructor as ReviewModel).calculateAverageRating(this.product);
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
  // Check if there's doc before calling the method
  if (doc) await doc.constructor.calculateAverageRating(doc.product);
});

export default mongoose.model<IReview, ReviewModel>('Review', reviewSchema);
