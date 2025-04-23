import crypto from 'crypto';
import bcrypt from 'bcrypt';
import mongoose, { Document, Types, Model } from 'mongoose';
import { IProduct } from './productModel.js';

export interface IAddress extends Document<Types.ObjectId> {
  alias: string;
  details: string;
  phone: string;
  city: string;
  postalCode: string;
}

export interface IUser extends Document<Types.ObjectId> {
  name: string;
  email: string;
  phone: string;
  profileImg: string;
  password: string;
  passwordChangedAt?: Date;
  passwordResetCode?: string;
  passwordResetExpires?: Date;
  role: 'user' | 'admin' | 'manager';
  active: boolean;
  verificationCode: string;
  verificationCodeExpires: Date;
  verified: boolean;
  wishlist: IProduct['id'][];
  addresses: IAddress[];
}

export interface IUserMethods {
  correctPassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamps: number): boolean;
  createPasswordResetCode(): string;
  createVerificationCode(): string;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const addressSchema = new mongoose.Schema<IAddress>({
  alias: String, // home, work, ...
  details: String,
  phone: String,
  city: String,
  postalCode: String,
});

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
  },
  phone: String,
  profileImg: {
    type: String,
    default:
      'https://res.cloudinary.com/dxbiecqpq/image/upload/v1718013705/rzjkgteqrnkfxiwo6acx.png',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Too short password'],
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetCode: String,
  passwordResetExpires: Date,
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  verified: {
    type: Boolean,
    default: false,
  },
  wishlist: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
    },
  ],
  addresses: [addressSchema],
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

userSchema.methods.correctPassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamps: number) {
  if (this.passwordChangedAt) {
    return this.passwordChangedAt.getTime() / 1000, 10 > JWTTimestamps;
  }

  return false;
};

/*
userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return token;
};
*/

userSchema.methods.createPasswordResetCode = function () {
  const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase();

  this.passwordResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetCode;
};

userSchema.methods.createVerificationCode = function () {
  const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();

  this.verificationCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
  this.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

  return verificationCode;
};

export default mongoose.model<IUser, UserModel>('User', userSchema);
