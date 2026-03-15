
import { Types } from "mongoose";
export interface IDriverWallet {
  driverId: Types.ObjectId;
  totalEarning: number;      // All earnings so far
  availableBalance: number;
  totalWithdrawn: number;    // Total amount withdrawn
  createdAt?: Date;
  updatedAt?: Date;
}