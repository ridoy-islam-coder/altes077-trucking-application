import { Schema, model } from "mongoose";

import { IDriverWallet } from "./driverWallet.interface";



const driverWalletSchema = new Schema<IDriverWallet>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true, unique: true },
    totalEarning: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DriverWalletModel = model<IDriverWallet>("DriverWallet", driverWalletSchema);