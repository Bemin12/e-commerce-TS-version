import mongoose, { Document, Model, Types } from 'mongoose';
import { IProduct } from './productModel.js';
import { IUser } from './userModel.js';

export interface ICartItem extends Document<Types.ObjectId> {
  product: IProduct['_id'];
  quantity: number;
  color: string;
  price: number;
}

export interface PopulatedCartItem extends Omit<ICartItem, 'product'> {
  product: IProduct | null;
}

export interface ICart extends Document<Types.ObjectId> {
  cartItems: ICartItem[];
  totalCartPrice: number;
  totalPriceAfterDiscount?: number;
  user: IUser['_id'];
  createdAt: Date;
}

// To treat cartItems as subdocument rather than nested property (used in `updateCartItemQuantity` in the controller when we used `.id`)
// See https://mongoosejs.com/docs/typescript/subdocuments.html
type THydratedCartDocument = {
  cartItems: Types.DocumentArray<ICartItem>;
} & ICart &
  ICartMethods;

interface ICartMethods {
  calcTotalCartPrice(productPrice: number, addedQuantity: number): void;
  detectProductQuantityAvailability(): {
    productChanged: boolean;
    cartObj: CartWithAvailabilityDetails;
  };
  detectPriceChange(): boolean;
}

type CartModel = Model<ICart, {}, ICartMethods, {}, THydratedCartDocument>;

const cartItemSchema = new mongoose.Schema<ICartItem>({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'Product id is required'],
  },
  quantity: {
    type: Number,
    min: [1, 'quantity must be a positive number'],
    default: 1,
  },
  color: String,
  price: Number,
});

const cartSchema = new mongoose.Schema<ICart, CartModel, ICartMethods>(
  {
    cartItems: [cartItemSchema],
    totalCartPrice: Number,
    totalPriceAfterDiscount: Number,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

cartSchema.methods.calcTotalCartPrice = function (productPrice: number, addedQuantity: number) {
  if (productPrice && addedQuantity) {
    this.totalCartPrice += productPrice * addedQuantity;
  }
  this.totalPriceAfterDiscount = undefined;
};

interface CartItemWithAvailability extends PopulatedCartItem {
  availabilityChanged: boolean;
  exists: boolean;
  quantityInCart?: number;
  availableQuantity?: number;
}

interface CartWithAvailabilityDetails extends Omit<ICart, 'cartItems'> {
  cartItems: CartItemWithAvailability[];
}

const setItemQuantityChanged = (item: CartItemWithAvailability, availableQuantity: number) => {
  item.availabilityChanged = true;
  item.exists = true;
  item.quantityInCart = item.quantity;
  item.availableQuantity = availableQuantity;
};

const setItemNotAvailable = (item: CartItemWithAvailability) => {
  item.availabilityChanged = true;
  item.exists = false;
};

cartSchema.methods.detectProductQuantityAvailability = function () {
  let productChanged = false;
  const cartObj = {} as CartWithAvailabilityDetails;
  Object.assign(cartObj, this.toObject());
  cartObj.cartItems.forEach((item) => {
    // Product exist
    if (item.product) {
      // Item with color
      if (item.color) {
        const variant = item.product.variants.find((prod) => prod.color === item.color);
        // variant exists
        if (variant) {
          if (variant.quantity < item.quantity) {
            productChanged = true;
            setItemQuantityChanged(item, variant.quantity);
          }
        }
        // variant doesn't exist
        else {
          productChanged = true;
          setItemNotAvailable(item);
        }
      }
      // Item without color
      else if (item.product.quantity < item.quantity) {
        productChanged = true;
        setItemQuantityChanged(item, item.product.quantity);
      }
    }
    // Product doesn't exist
    else {
      productChanged = true;
      setItemNotAvailable(item);
    }
  });

  return { productChanged, cartObj };
};

cartSchema.methods.detectPriceChange = function () {
  let priceChange = false;
  const cartItems = this.cartItems as unknown as PopulatedCartItem[];
  // Iterate over each item and compare its price when first added with the current price
  cartItems.forEach((item) => {
    // If there is difference in the price, update the item price and the totalCartPrice
    if (item.product) {
      if (item.product.price !== item.price) {
        this.totalCartPrice -= item.price * item.quantity;
        item.price = item.product.price;
        this.totalCartPrice += item.price * item.quantity;

        priceChange = true;
      }
    }
  });

  if (priceChange) this.totalPriceAfterDiscount = undefined;

  return priceChange;
};

export default mongoose.model<ICart, CartModel>('Cart', cartSchema);
