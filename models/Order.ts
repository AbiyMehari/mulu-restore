import mongoose, { Document, Model, Schema } from 'mongoose';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  title: string;
  unitPrice: number; // cents
  quantity: number;
}

export interface IShippingAddress {
  fullName: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId;
  guestEmail?: string;
  status: OrderStatus;
  currency: string;
  totalAmount: number; // cents
  paymentIntentId?: string;
  stripeSessionId?: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    guestEmail: { type: String, trim: true, lowercase: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'shipped', 'cancelled'],
      default: 'pending',
    },
    currency: { type: String, required: true, default: 'EUR' },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentIntentId: { type: String, trim: true },
    stripeSessionId: { type: String, trim: true },
    items: { type: [OrderItemSchema], required: true, default: [] },
    shippingAddress: { type: ShippingAddressSchema, required: true },
  },
  { timestamps: true }
);

// Require either user OR guestEmail (at least one)
OrderSchema.path('guestEmail').validate(function (this: IOrder, value: unknown) {
  const guest = typeof value === 'string' ? value.trim() : '';
  return Boolean(this.user) || guest.length > 0;
}, 'Either user or guestEmail is required');

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
