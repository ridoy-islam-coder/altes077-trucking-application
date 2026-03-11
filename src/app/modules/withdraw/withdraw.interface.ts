import { Types } from "mongoose";

export interface IWithdraw {
  driverId: Types.ObjectId;

  amount: number;

  stripePayoutId?: string;

  status: "processing" | "paid" | "failed";

  createdAt?: Date;
  updatedAt?: Date;
}