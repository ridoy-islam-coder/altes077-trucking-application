import { DriverWalletModel } from "./driverWallet.model";


// Add earning to driver wallet
export const addEarning = async (driverId: string, amount: number) => {
  return await DriverWalletModel.findOneAndUpdate(
    { driverId },
    { $inc: { totalEarning: amount, availableBalance: amount } },
    { upsert: true, new: true }
  );
};

// Get wallet info
export const getWallet = async (driverId: string) => {
  const wallet = await DriverWalletModel.findOne({ driverId });
  if (!wallet) {
    return await DriverWalletModel.create({
      driverId,
      totalEarning: 0,
      availableBalance: 0,
    });
  }
  return wallet;
};
