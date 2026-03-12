
import { Types } from "mongoose";
export interface IDriverWallet {
  driverId: Types.ObjectId;
  totalEarning: number;      // All earnings so far
  availableBalance: number;  // Withdrawable balance
  createdAt?: Date;
  updatedAt?: Date;
}