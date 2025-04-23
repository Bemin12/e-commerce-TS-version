import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express-serve-static-core';

import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/apiError.js';
import Cart, { ICartItem, PopulatedCartItem } from '../models/cartModel.js';
import Product, { IProduct } from '../models/productModel.js';
import Coupon from '../models/couponModel.js';

/*
  Note:
    Some controllers have more than one implementation (found at the end of the file)
    The goal was to find a better and atomic approach, and doing less database trips to achieve the functionalities
    The chosen approaches depend primarily on using MongoDB updates with aggregation with the least trips to the database to consider concurrency and avoid race conditions
    The other implementations may deal with operations more in the application layer
    Controllers that has a comment like [ // controllerName - method number ] has another implementation or more below
*/

const checkProductQuantity = (product: IProduct, quantity: number, color: string) => {
  let variant;
  // Added product with color
  if (color) {
    variant = product.variants.find((prod) => prod.color === color.toLowerCase());
    if (!variant) {
      return new APIError('Product is not available with this color', 404);
    }

    if (quantity > variant.quantity) {
      if (variant.quantity === 0) {
        return new APIError(`Product is out of stock`, 400);
      }
      return new APIError(
        `Only ${variant.quantity} items available in the stock, requested are ${quantity}`,
        400,
      );
    }
  }
  // Added product without color
  else if (quantity > product.quantity) {
    if (product.quantity === 0) {
      return new APIError(`Product is out of stock`, 400);
    }
    return new APIError(
      `Only ${product.quantity} items available in the stock, requested are ${quantity}`,
      400,
    );
  }

  return variant;
};

// addProductToCart - method 1 using aggregation update - one database trip
// @desc    Add product to cart
// @route   POST /api/v1/cart
// @access  Protected: User
export const addProductToCart = asyncHandler(
  async (
    req: Request<{}, {}, { productId: string } & Pick<ICartItem, 'color' | 'quantity'>>,
    res: Response,
    next: NextFunction,
  ) => {
    const { productId, color, quantity = 1 } = req.body;

    // Get the product from the database
    const product = await Product.findById(productId);

    // Throw error if there's no product with the specified id
    if (!product) {
      return next(new APIError('No product found with this id', 404));
    }

    // Make sure that there's sufficient quantity
    const variant = checkProductQuantity(product, quantity, color);
    if (variant instanceof APIError) return next(variant);

    // Update the user cart if exists, or create one with the specified product
    const cart = await Cart.findOneAndUpdate(
      { user: req.user!._id },
      [
        {
          $set: {
            cartItems: {
              $cond: [
                // Check for existing cart with the specified product and color
                {
                  // $anyElementTrue: Evaluates an array as a set and returns true if any of the elements are true and false otherwise.
                  // An empty array returns false.
                  $anyElementTrue: {
                    $map: {
                      input: { $ifNull: ['$cartItems', []] },
                      in: {
                        $and: [
                          { $eq: ['$$this.product', new mongoose.Types.ObjectId(productId)] },
                          { $eq: ['$$this.color', color] },
                        ],
                      },
                    },
                  },
                },
                // If cart exist with the specified product, increment its quantity and place other products as they are
                {
                  $map: {
                    input: '$cartItems',
                    in: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ['$$this.product', new mongoose.Types.ObjectId(productId)] },
                            { $eq: ['$$this.color', color] },
                          ],
                        },
                        {
                          $mergeObjects: [
                            '$$this',
                            { quantity: { $add: ['$$this.quantity', quantity] } },
                          ],
                        },
                        '$$this',
                      ],
                    },
                  },
                },
                // If not, add the product to cart if there's one, or create new cart with the specified product
                {
                  $concatArrays: [
                    { $ifNull: ['$cartItems', []] },
                    [
                      {
                        product: new mongoose.Types.ObjectId(productId),
                        color,
                        quantity: quantity || 1,
                        price: product.price,
                        _id: new mongoose.Types.ObjectId(),
                      },
                    ],
                  ],
                },
              ],
            },
            // Calculating the total cart price
            totalCartPrice: {
              $add: [
                { $ifNull: ['$totalCartPrice', 0] },
                { $multiply: [product.price, quantity || 1] },
              ],
            },
            user: req.user!._id,
          },
        },
      ],
      { upsert: true, new: true, runValidators: true },
    );

    // Extra step to check if the product was already in the cart and its quantity exceeded the available quantity after increasing it
    let returnToOldState = false;
    let variantInCart: ICartItem | undefined;
    let itemInCart: ICartItem | undefined;
    if (variant) {
      // Get the product from the cart
      variantInCart = cart.cartItems.find(
        (item) => item.product.toString() === product._id.toString() && item.color === color,
      );
      // Check if the variant quantity is less than the updated quantity in cart
      if (variant.quantity < variantInCart!.quantity) {
        returnToOldState = true;
      }
    } else {
      itemInCart = cart.cartItems.find(
        (it) => it.product.toString() === product._id.toString() && !it.color,
      );
      if (product.quantity < itemInCart!.quantity) {
        returnToOldState = true;
      }
    }

    // Return the cart to its previous state and return an error
    if (returnToOldState) {
      const itemId = variant ? variantInCart!._id : itemInCart!._id;
      await Cart.updateOne(
        { user: req.user._id, 'cartItems._id': itemId },
        {
          $inc: { 'cartItems.$.quantity': -quantity, totalCartPrice: -(product.price * quantity) },
        },
      );
      return next(new APIError('Quantity in cart exceeded the available quantity', 400));
    }

    res
      .status(200)
      .json({ status: 'success', numberOfCartItems: cart.cartItems.length, data: { cart } });
  },
);

// @desc    Get current user cart
// @route   GET /api/v1/cart
// @access  Protected: User
export const getCurrentUserCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user!._id }).populate<{
    cartItems: PopulatedCartItem[];
  }>({
    path: 'cartItems.product',
    select: 'name price quantity imageCover variants',
    options: { skipPopulation: true }, // to skip populating the product category in productModel
  });

  if (!cart) {
    return next(new APIError('There is no cart for this user', 404));
  }

  // Check if any product becomes unavailable or a change happened in the stock
  const { productChanged, cartObj } = cart.detectProductQuantityAvailability();
  if (productChanged) {
    return res.status(200).json({
      status: 'warn',
      message: 'Some changes happened to the products in cart items',
      data: { cart: cartObj },
    });
  }

  // Check if a change in a product price in the cart happened
  const priceChange = cart.detectPriceChange();

  // If there is a change, the cart will be updated with the new price
  if (priceChange) {
    cart = await cart.save();
  }

  res
    .status(200)
    .json({ status: 'success', numOfCartItems: cart.cartItems.length, data: { cart } });
});

// removeSpecifCartItem - method 1 - one database trip
// @desc    Remove specific cart item
// @route   DELETE /api/v1/cart/:itemId
// @access  Protected: User
export const removeSpecifCartItem = asyncHandler(
  async (req: Request<{ itemId: string }>, res: Response, next: NextFunction) => {
    const cart = await Cart.findOneAndUpdate(
      {
        user: req.user!._id,
      },
      [
        {
          $set: {
            // Filter cart items from the specified item
            cartItems: {
              $filter: {
                input: '$cartItems',
                cond: { $ne: ['$$this._id', new mongoose.Types.ObjectId(req.params.itemId)] },
              },
            },
          },
        },
        // Recalculate the total price
        {
          $set: {
            totalCartPrice: {
              $reduce: {
                input: '$cartItems',
                initialValue: 0,
                in: { $add: ['$$value', { $multiply: ['$$this.price', '$$this.quantity'] }] },
              },
            },
          },
        },
        {
          $unset: 'totalPriceAfterDiscount',
        },
      ],
      { new: true },
    );

    if (!cart) {
      return next(new APIError('There is no cart for this user', 404));
    }

    // Delete cart if it becomes empty
    if (cart.cartItems.length === 0) {
      await cart.deleteOne();
      return res.status(204).send();
    }

    res.status(200).json({ status: 'success', data: { cart } });
  },
);

// @desc    Clear user cart
// @route   DELETE /api/v1/cart/
// @access  Protected: User
export const clearCart = asyncHandler(async (req, res, next) => {
  await Cart.findOneAndDelete({ user: req.user!._id });
  res.status(204).send();
});

// @desc    Update specific cart item quantity
// @route   PATCH /api/v1/cart/:itemId
// @access  Protected: User

export const updateCartItemQuantity = asyncHandler(
  async (
    req: Request<{ itemId: string }, {}, { quantity: number }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { quantity } = req.body;

    // Check if there is a cart for the current user
    const cart = await Cart.findOne({ user: req.user!._id });
    if (!cart) {
      return next(new APIError('There is no cart for this user', 404));
    }

    // Check if the item exist in the cart
    const itemToUpdate = cart.cartItems.id(req.params.itemId);
    if (!itemToUpdate) {
      return next(new APIError('There is no item for this id', 404));
    }

    // Make sure that there's sufficient quantity
    const product = await Product.findById(itemToUpdate.product);

    const check = checkProductQuantity(product!, quantity, itemToUpdate.color);

    if (check instanceof APIError) return next(check);

    // Update the cart
    // Calculate the difference between new and old quantity
    // Positive value means quantity increased, negative means decreased
    const quantityChange = quantity - itemToUpdate.quantity;
    const itemPrice = itemToUpdate.price;
    itemToUpdate.quantity = quantity;
    cart.calcTotalCartPrice(itemPrice, quantityChange); // update cart total price

    await cart.save();

    res
      .status(200)
      .json({ status: 'success', numOfCartItems: cart.cartItems.length, data: { cart } });
  },
);

// @desc    Apply coupon to cart
// @route   PATCH /api/v1/applyCoupon
// @access  Protect: User
export const applyCoupon = asyncHandler(
  async (req: Request<{}, {}, { coupon: string }>, res: Response, next: NextFunction) => {
    const coupon = await Coupon.findOne({ name: req.body.coupon, expireAt: { $gt: Date.now() } });
    if (!coupon) {
      return next(new APIError('Coupon is invalid or expired', 400));
    }

    const discount = coupon.discount / 100;
    const cart = await Cart.findOneAndUpdate(
      { user: req.user!._id },
      [
        {
          $set: {
            totalPriceAfterDiscount: {
              $round: [
                { $subtract: ['$totalCartPrice', { $multiply: ['$totalCartPrice', discount] }] },
                2,
              ],
            },
          },
        },
      ],
      { new: true },
    );

    res.status(200).json({ status: 'success', data: { cart } });
  },
);

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Other Methods Implementations

// addProductToCart - method 2
/*
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color, quantity = 1 } = req.body;

  // Get the product from the database
  const product = await Product.findById(productId);

  // Throw error if there's no product with the specified id
  if (!product) {
    return next(new APIError('No product found with this id', 404));
  }

  // Make sure that there's sufficient quantity
  if (quantity > product.quantity) {
    if (product.quantity === 0) {
      return next(new APIError(`Product is out of stock`, 400));
    }
    return next(
      new APIError(
        `Only ${product.quantity} items available in the stock, requested are ${quantity}`,
        400,
      ),
    );
  }

  // Check for an existing cart for the user with the specified product and color and update product quantity and total price if so
  let cart = await Cart.findOneAndUpdate(
    {
      user: req.user._id,
      cartItems: { $elemMatch: { product: productId, color } },
    },
    {
      $inc: { 'cartItems.$.quantity': quantity, totalCartPrice: product.price * quantity },
    },
    { new: true, runValidators: true },
  );

  // Otherwise create a insert the product to user cart or create a new cart if no one exists (upsert)
  if (!cart) {
    cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: {
          cartItems: [
            {
              product: productId,
              quantity,
              color,
              price: product.price,
            },
          ],
        },
        $inc: { totalCartPrice: quantity * product.price },
        $setOnInsert: { user: req.user._id },
      },
      { upsert: true, new: true, runValidators: true },
    );
  }

  res
    .status(200)
    .json({ status: 'success', numberOfCartItems: cart.cartItems.length, data: { cart } });
});
*/

// addProductToCart - method 3
/*
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color, quantity = 1 } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new APIError('No product found with this id', 404));
  }

  // Make sure that there's sufficient quantity
  const variant = checkProductQuantity(product, quantity, color);
  if (variant instanceof APIError) return next(variant);

  // Search for user car
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    // If cart doesn't exist, create new one with the provided product
    cart = await Cart.create({
      cartItems: [
        {
          product: productId,
          quantity,
          color,
          price: product.price,
        },
      ],
      totalCartPrice: quantity * product.price,
      user: req.user._id,
    });
  } else {
    // else if cart exists, check if it has the added product
    const itemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && item.color === color,
    );
    // If the product exists in the cart, increment its quantity if it could be
    if (itemIndex !== -1) {
      // Check if total quantity after increase exceed the product quantity
      if (variant) {
        if (cart.cartItems[itemIndex].quantity + quantity > variant.quantity)
          return next(new APIError('Quantity in cart exceeded the available quantity', 400));
      } else if (cart.cartItems[itemIndex].quantity + quantity > product.quantity)
        return next(new APIError('Quantity in cart exceeded the available quantity', 400));

      cart.cartItems[itemIndex].quantity += quantity;
    } else {
      // If the product doesn't, push it into the cartItems array
      cart.cartItems.push({ product: productId, quantity, color, price: product.price });
    }
    // Update the cart total price
    cart.calcTotalCartPrice(product.price, quantity);
    await cart.save();
  }

  res
    .status(200)
    .json({ status: 'success', numOfCartItems: cart.cartItems.length, data: { cart } });
});
*/

// removeSpecifCartItem - method 2 - two database trips
/*
exports.removeSpecifCartItem = asyncHandler(async (req, res, next) => {
  // pull item from cartItems if exist
  let cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: req.params.itemId } },
    },
    { new: true },
  );

  if (!cart) {
    return next(new APIError('There is no cart for this user', 404));
  }

  // Delete cart if it becomes empty
  if (cart.cartItems.length === 0) {
    await cart.deleteOne();
    return res.status(204).send();
  }

  // Update totalCartPrice
  cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    [
      {
        $set: {
          totalCartPrice: {
            $reduce: {
              input: '$cartItems',
              initialValue: 0,
              in: { $add: ['$$value', { $multiply: ['$$this.price', '$$this.quantity'] }] }, // reduce (item => item.price * item.quantity)
            },
          },
        },
      },
      {
        $unset: 'totalPriceAfterDiscount',
      },
    ],
    { new: true },
  );

  res.status(200).json({ status: 'success', data: { cart } });
});
*/

// removeSpecifCartItem - method 3 - two database trips
/*
exports.removeSpecifCartItem = asyncHandler(async (req, res, next) => {
  // Find the cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new APIError('There is no cart for this user', 404));
  }

  // Check if item exist in the cart
  const itemToRemove = cart.cartItems.id(req.params.itemId);

  // The item doesn't exist
  if (!itemToRemove) {
    return new APIError('No item found with this id', 404);
  }

  // Update the total cart price and remove the item from the cart
  cart.cartItems.pull(itemToRemove);
  cart.calcTotalCartPrice(itemToRemove.price, -itemToRemove.quantity);

  // Delete cart if it becomes empty
  if (cart.cartItems.length === 0) {
    await cart.deleteOne();
    return res.status(204).send();
  }

  cart = await cart.save();

  res.status(200).json({ status: 'success', data: { cart } });
});
*/
