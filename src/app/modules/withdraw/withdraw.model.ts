import { Schema, model } from "mongoose";
import { IWithdraw, WithdrawStatus } from "./withdraw.interface";

const withdrawSchema = new Schema<IWithdraw>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "usd",
    },

    stripePayoutId: {
      type: String,
    },

    status: {
      type: String,
      enum: ["processing", "paid", "failed"],
      default: "processing",
    },

    failureReason: {
      type: String,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const WithdrawModel = model<IWithdraw>("Withdraw", withdrawSchema);