import Stripe from "stripe";
import { DriverWalletModel } from "../driverWallet/driverWallet.model";
import { DriverModel } from "../drivermodel/dirver.model";
import { WithdrawModel } from "./withdraw.model";
import config from "../../config";
import mongoose from "mongoose";

const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
  apiVersion: "2024-06-20" as any,
});

// export const withdrawService = async (driverId: string, amount: number) => {

//   const wallet = await DriverWalletModel.findOne({ driverId });
//   console.log("Driver Wallet:", wallet);

//   if (!wallet || wallet.availableBalance < amount) {
//     throw new Error("Insufficient balance");
//   }

//   const driver = await DriverModel.findById(driverId);

//   if (!driver?.stripe_account_id) {
//     throw new Error("Driver stripe account not connected");
//   }

//   const withdraw = await WithdrawModel.create({
//     driverId,
//     amount,
//     status: "processing",
//   });

//   try {

//     const payout = await stripe.payouts.create(
//       {
//         amount: Math.round(amount * 100),
//         currency: "usd",
//         method: "standard",
//       },
//       {
//         stripeAccount: driver.stripe_account_id,
//       }
//     );

//     withdraw.status = "paid";
//     withdraw.stripePayoutId = payout.id;
//     withdraw.processedAt = new Date();
//     await withdraw.save();

//     // wallet update (ONLY ONCE)
//     wallet.availableBalance -= amount;
//     wallet.totalWithdrawn += amount;
//     await wallet.save();

//     return withdraw;

//   } catch (error: any) {
//     withdraw.status = "failed";
//     withdraw.failureReason = error.message;
//     await withdraw.save();

//     throw new Error("Withdraw failed: " + error.message);
//   }
// };



export const withdrawService = async (driverId: string, amount: number) => {

  // 1️⃣ Find driver by userId
  const driver = await DriverModel.findOne({
    userId: new mongoose.Types.ObjectId(driverId)
  });
  if (!driver) throw new Error("Driver not found");

  // 2️⃣ Find wallet by driver._id
  let wallet = await DriverWalletModel.findOne({ driverId: driver._id });

  // 3️⃣ Auto-create wallet if not exist
  if (!wallet) {
    wallet = await DriverWalletModel.create({
      driverId: driver._id,
      availableBalance: 0,
      totalEarning: 0,
      totalWithdrawn: 0,
    });
  }

  console.log("Driver Wallet:", wallet);

  // 4️⃣ Check balance
  if (wallet.availableBalance < amount) {
    throw new Error("Insufficient balance");
  }

  // 5️⃣ Check Stripe account
  if (!driver.stripe_account_id) {
    throw new Error("Driver stripe account not connected");
  }

  // 6️⃣ Create withdraw record
  const withdraw = await WithdrawModel.create({
    driverId: driver._id,
    amount,
    status: "processing",
  });

  try {
    // 7️⃣ Stripe payout
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // dollars to cents
        currency: "usd",
        method: "standard", // safe method
      },
      {
        stripeAccount: driver.stripe_account_id,
      }
    );

    // 8️⃣ Update withdraw record
    withdraw.status = "paid";
    withdraw.stripePayoutId = payout.id;
    withdraw.processedAt = new Date();
    await withdraw.save();

    // 9️⃣ Update wallet balance
    wallet.availableBalance -= amount;
    wallet.totalWithdrawn += amount;
    await wallet.save();

    return withdraw;

  } catch (error: any) {
    withdraw.status = "failed";
    withdraw.failureReason = error.message;
    await withdraw.save();
    throw new Error("Withdraw failed: " + error.message);
  }
};