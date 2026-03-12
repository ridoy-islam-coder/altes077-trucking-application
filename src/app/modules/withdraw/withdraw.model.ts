import { Schema, model } from "mongoose";
import { IWithdraw } from "./withdraw.interface";


const withdrawSchema = new Schema<IWithdraw>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    amount: { type: Number, required: true },
    stripePayoutId: { type: String },
    status: { type: String, enum: ["processing", "paid", "failed"], default: "processing" },
  },
  { timestamps: true }
);

export const WithdrawModel = model<IWithdraw>("Withdraw", withdrawSchema);