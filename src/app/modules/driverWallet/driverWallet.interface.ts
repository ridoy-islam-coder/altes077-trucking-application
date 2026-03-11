import { Types } from "mongoose";

export interface IDriverWallet {
  driverId: Types.ObjectId;

  availableBalance: number;
  totalEarning: number;

  createdAt?: Date;
  updatedAt?: Date;
}