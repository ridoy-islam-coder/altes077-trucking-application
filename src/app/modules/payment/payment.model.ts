import { Schema, model } from "mongoose";
import { IPayment } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    adminCommission: {
      type: Number,
      required: true,
    },

    driverEarning: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "usd",
    },

    stripePaymentIntentId: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentModel = model<IPayment>(
  "Payment",
  paymentSchema
);
