import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Category document interface
 */
export interface ICategory extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category schema definition
 */
const CategorySchema = new Schema<ICategory>(
  {
    name: {
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
  },
  {
    timestamps: true,
  }
);

/**
 * Export Category model safely for Next.js
 * Prevents recompilation issues in development
 */
const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
