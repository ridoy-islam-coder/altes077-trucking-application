// import { DriverWalletModel } from "../models/driverWallet.model";

// // Add earning to driver wallet
// export const addEarning = async (driverId: string, amount: number) => {
//   return await DriverWalletModel.findOneAndUpdate(
//     { driverId },
//     {
//       $inc: { totalEarning: amount, availableBalance: amount },
//     },
//     { upsert: true, new: true }
//   );
// };

// // Get wallet info
// export const getWallet = async (driverId: string) => {
//   const wallet = await DriverWalletModel.findOne({ driverId });
//   if (!wallet) {
//     return await DriverWalletModel.create({
//       driverId,
//       totalEarning: 0,
//       availableBalance: 0,
//     });
//   }
//   return wallet;
// };




// import { Request, Response } from "express";
// import { getWallet } from "../services/wallet.service";

// // Get driver wallet info
// export const getDriverWallet = async (req: Request, res: Response) => {
//   try {
//     const driverId = req.params.driverId;
//     const wallet = await getWallet(driverId);

//     res.json({ success: true, wallet });
//   } catch (err: any) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };