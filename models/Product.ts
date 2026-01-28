import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Product condition types
 */
export type ProductCondition = 'vintage' | 'restored' | 'used';

/**
 * Product document interface
 */
export interface IProduct extends Document {
  title: string;
  slug: string;
  price: number; // stored in cents
  currency: string; // EUR
  stockQuantity: number;
  category: mongoose.Types.ObjectId;
  images: string[]; // Cloudinary URLs
  shortDescription: string;
  fullDescription: string;
  condition: ProductCondition;
  attributes: {
    material?: string;
    style?: string;
    era?: string;
  };
  dimensions: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
  };
  shipping: {
    pickupOnly: boolean;
    shippingPossible: boolean;
    shippingNotes?: string;
  };
  isActive: boolean;
  isDeleted: boolean; // soft delete
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product schema definition
 */
const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0, // price in cents, must be non-negative
    },
    currency: {
      type: String,
      required: true,
      default: 'EUR',
      enum: ['EUR'],
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    images: [
      {
        type: String, // Cloudinary URLs
      },
    ],
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    fullDescription: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      required: true,
      enum: ['vintage', 'restored', 'used'],
    },
    attributes: {
      material: {
        type: String,
        trim: true,
      },
      style: {
        type: String,
        trim: true,
      },
      era: {
        type: String,
        trim: true,
      },
    },
    dimensions: {
      width: {
        type: Number,
        min: 0,
      },
      height: {
        type: Number,
        min: 0,
      },
      depth: {
        type: Number,
        min: 0,
      },
      weight: {
        type: Number,
        min: 0,
      },
    },
    shipping: {
      pickupOnly: {
        type: Boolean,
        required: true,
        default: false,
      },
      shippingPossible: {
        type: Boolean,
        required: true,
        default: false,
      },
      shippingNotes: {
        type: String,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
      index: true, // index for soft delete queries
    },
    viewCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Export Product model safely for Next.js
 * Prevents recompilation issues in development
 */
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
