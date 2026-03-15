import Stripe from "stripe";
// import { addEarning } from "./wallet.service";
import { IRide } from "../ride/ride.interface";
import { addEarning } from "../driverWallet/driverWallet.service";
import config from "../../config";
import { PaymentModel } from "./payment.model";


const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
  apiVersion: "2024-06-20" as any,
});
// User pays for a ride
// export const payRideService = async (userId: string, ride: IRide) => {
//   const amount = ride.fare;
//   const driverId = ride.driverId.toString();

//   // Create PaymentIntent on Admin account
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: Math.round(amount * 100), // cents
//     currency: "usd",
//     payment_method_types: ["card"],
//     metadata: {
//       userId,
//       rideId: ride._id.toString(),
//       driverId,
//     },
//   });

//   // Admin commission 20%
//   const adminCommission = Math.round(amount * 0.2);
//   const driverAmount = amount - adminCommission;

//   // Add driver earning to wallet
//   await addEarning(driverId, driverAmount);

//   return {
//     paymentIntentId: paymentIntent.id,
//     driverAmount,
//     adminCommission,
//   };
// };






export const payRideService = async (userId: string, ride: IRide) => {
  if (!ride.driverId) {
    throw new Error("Driver not assigned");
  }

  const amount = ride.fare;
  const driverId = ride.driverId.toString();

  // Stripe PaymentIntent create
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    payment_method_types: ["card"],
    metadata: {
      userId: userId.toString(),
      rideId: ride._id.toString(),
      driverId: driverId.toString(),
    },
  });

  // Calculate admin commission and driver earning
  const adminCommission = Math.round(amount * 0.2);
  const driverAmount = amount - adminCommission;

  // Add driver earning to wallet
  await addEarning(driverId, driverAmount);

  // Save Payment in DB
  const paymentDoc = await PaymentModel.create({
    rideId: ride._id,
    userId,
    driverId,
    totalAmount: amount,
    adminCommission,
    driverEarning: driverAmount,
    stripePaymentIntentId: paymentIntent.id,
    paymentStatus: "pending", // Stripe confirm করার আগে pending রাখি
  });

  return {
    paymentIntentId: paymentIntent.id,
    driverAmount,
    adminCommission,
    paymentRecord: paymentDoc,
  };
};





