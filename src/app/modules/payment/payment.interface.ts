import { Types } from "mongoose";

export interface IPayment {
  rideId: Types.ObjectId;
  userId: Types.ObjectId;
  driverId: Types.ObjectId;

  totalAmount: number;
  adminCommission: number;
  driverEarning: number;

  currency: string;

  stripePaymentIntentId?: string;

  paymentStatus: "pending" | "paid" | "failed";

  createdAt?: Date;
  updatedAt?: Date;
}