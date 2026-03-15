import { Types } from "mongoose";

export type WithdrawStatus = "processing" | "paid" | "failed";

export interface IWithdraw {
  driverId: Types.ObjectId;
  amount: number;
  currency?: string;
  stripePayoutId?: string;
  status: WithdrawStatus;
  failureReason?: string;
  requestedAt?: Date;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}