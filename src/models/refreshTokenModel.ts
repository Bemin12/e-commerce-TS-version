import crypto from 'crypto';
import mongoose, { Document, Types } from 'mongoose';
import { IUser } from './userModel.js';

export interface IRefresh extends Document<Types.ObjectId> {
  token: string;
  user: IUser['_id'];
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenSchema = new mongoose.Schema<IRefresh>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// TTL index
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.pre('save', function (next) {
  this.token = crypto.createHash('sha256').update(this.token).digest('hex');
  next();
});

export default mongoose.model<IRefresh>('RefreshToken', refreshTokenSchema);
