import { z } from 'zod';

/**
 * Zod schema for product image
 */
const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  publicId: z.string().optional(),
});

/**
 * Zod schema for product attributes
 */
const productAttributesSchema = z.object({
  material: z.string().optional(),
  style: z.string().optional(),
  era: z.string().optional(),
}).optional();

/**
 * Zod schema for product dimensions
 */
const productDimensionsSchema = z.object({
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  depth: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
}).optional();

/**
 * Zod schema for product shipping info
 */
const productShippingSchema = z.object({
  pickupOnly: z.boolean().optional(),
  shippingPossible: z.boolean().optional(),
  shippingNotes: z.string().optional(),
}).optional();

/**
 * Zod schema for creating a product (POST /api/admin/products)
 * Matches PRD.md field names
 */
export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  price: z.number().int().min(0, 'Price must be a non-negative integer (in cents)'),
  currency: z.string().optional().default('EUR'),
  stock: z.number().int().min(0).optional().default(0),
  categoryId: z.string().min(1, 'Category ID is required'),
  images: z.array(productImageSchema).optional(),
  descriptionShort: z.string().optional(),
  description: z.string().optional(),
  condition: z.enum(['vintage', 'restored', 'used']),
  attributes: productAttributesSchema,
  dimensions: productDimensionsSchema,
  shipping: productShippingSchema,
  isActive: z.boolean().optional().default(true),
});
