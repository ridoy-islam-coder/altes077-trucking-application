import Stripe from "stripe";
import { DriverWalletModel } from "../driverWallet/driverWallet.model";
import { WithdrawModel } from "./withdraw.model";
import config from "../../config";


const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
  apiVersion: "2024-06-20" as any,
});
export const withdrawService = async (driverId: string, amount: number, stripeAccountId: string) => {
  const wallet = await DriverWalletModel.findOne({ driverId });
  if (!wallet || wallet.availableBalance < amount) {
    throw new Error("Insufficient balance");
  }

  // Stripe Instant Payout
  const payout = await stripe.payouts.create(
    { amount: Math.round(amount * 100), currency: "usd", method: "instant" },
    { stripeAccount: stripeAccountId }
  );

  // Update wallet
  wallet.availableBalance -= amount;
  await wallet.save();

  // Save withdraw history
  const withdrawRecord = await WithdrawModel.create({
    driverId,
    amount,
    stripePayoutId: payout.id,
    status: "paid",
  });

  return withdrawRecord;
};



// import { Request, Response } from "express";
// import { withdrawService } from "../services/withdraw.service";
// import { DriverModel } from "../models/driver.model";
// import { DriverWalletModel } from "../driverWallet/driverWallet.model";
// import { WithdrawModel } from "./withdraw.model";

// // Driver withdraw money (driver only provides amount)
// export const withdrawAmount = async (req: Request, res: Response) => {
//   try {
//     const driverId = req.user.id; // driver token থেকে driverId
//     const { amount } = req.body;

//     if (!amount) {
//       return res.status(400).json({ success: false, message: "amount required" });
//     }

//     // Fetch stripeAccountId from DB
//     const driver = await DriverModel.findById(driverId);
//     if (!driver || !driver.stripeAccountId) {
//       return res.status(400).json({ success: false, message: "Stripe account not linked" });
//     }

//     const withdraw = await withdrawService(driverId, amount, driver.stripeAccountId);

//     res.json({ success: true, withdraw });
//   } catch (err: any) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };