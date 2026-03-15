import Stripe from "stripe";
import { DriverWalletModel } from "../driverWallet/driverWallet.model";
import { DriverModel } from "../drivermodel/dirver.model";
import { WithdrawModel } from "./withdraw.model";
import config from "../../config";

const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
  apiVersion: "2024-06-20" as any,
});


export const withdrawService = async (driverId: string, amount: number) => {

  // 1️⃣ Wallet check
  const wallet = await DriverWalletModel.findOne({ driverId });
  if (!wallet || wallet.availableBalance < amount) {
    throw new Error("Insufficient balance");
  }

  // 2️⃣ Driver Stripe account check
  const driver = await DriverModel.findById(driverId);
  if (!driver?.stripe_account_id) {
    throw new Error("Driver stripe account not connected");
  }

  // 3️⃣ Create Withdraw record
  const withdraw = await WithdrawModel.create({
    driverId,
    amount,
    status: "processing",
  });

  try {
    // 4️⃣ Stripe instant payout
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // cents
        currency: "usd",
        method: "instant",
      },
      {
        stripeAccount: driver.stripe_account_id,
      }
    );

    // 5️⃣ Update Withdraw record
    withdraw.status = "paid";
    withdraw.stripePayoutId = payout.id;
    withdraw.processedAt = new Date();
    await withdraw.save();
    
    wallet.totalWithdrawn += amount;
   wallet.availableBalance -= amount;
   await wallet.save();
    // 6️⃣ Update wallet balance
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