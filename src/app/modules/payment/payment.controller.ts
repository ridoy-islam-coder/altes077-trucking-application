// import { Request, Response } from "express";
// import { RideModel } from "../ride/ride.model";
// import { payRideService } from "./payment.service";


// export const payForRide = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user.id;
//     const rideId = req.params.rideId;

//     const ride = await RideModel.findById(rideId);

//     if (!ride) {
//       return res.status(404).json({ success: false, message: "Ride not found" });
//     }

//     if (!ride.driverId) {
//       return res.status(400).json({ success: false, message: "Driver not assigned for this ride" });
//     }

//     const payment = await payRideService(userId, ride);

//     res.json({ success: true, payment });
//   } catch (err: any) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

import { Request, Response } from "express";
import Stripe from "stripe";
import config from "../../config";
import { RideModel } from "../ride/ride.model";
import { addEarning } from "../driverWallet/driverWallet.service";

import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import AppError from "../../error/AppError";
import { PaymentModel } from "./payment.model";
import StripeUtils from "../../utils/stripe.utils";

const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
  apiVersion: "2024-06-20" as any,
});

export const payForRideAPI = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required");
  }

  const rideId = req.params.rideId;
  const ride = await RideModel.findById(rideId);

  if (!ride) {
    return res.status(404).json({ success: false, message: "Ride not found" });
  }

  if (!ride.driverId) {
    return res.status(400).json({ success: false, message: "Driver not assigned for this ride" });
  }

  const amount = ride.fare;
  const driverId = ride.driverId.toString();

  // Get Stripe customer ID (existing or new)
  const customerId = await StripeUtils.checkCustomerId(req.user.stripe_customer_id, req.user.email);
  if (!customerId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Stripe customer ID is required");
  }

  // Create ephemeral key (mobile SDK use)
  const ephemeralKey = await StripeUtils.createEphemeralKey(customerId);

  // Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: "usd",
    customer: customerId,
    payment_method_types: ["card"],
    metadata: {
      userId: req.user._id.toString(),
      rideId: ride._id.toString(),
      driverId,
    },
  });

  // Admin commission 20%
  const adminCommission = Math.round(amount * 0.2);
  const driverAmount = amount - adminCommission;

  // Add driver earning to wallet
  await addEarning(driverId, driverAmount);

  // Save payment record
  const paymentRecord = await PaymentModel.create({
    rideId: ride._id,
    userId: req.user._id,
    driverId,
    totalAmount: amount,
    adminCommission,
    driverEarning: driverAmount,
    currency: "usd",
    stripePaymentIntentId: paymentIntent.id,
    paymentStatus: "pending",
  });

  // Send response for mobile client
  res.status(201).json({
    success: true,
    payment: {
      paymentIntent: paymentIntent.client_secret, // client secret
      ephemeralKey,
      customer: customerId,
      publishableKey: config.stripe.publishKey,
      driverAmount,
      adminCommission,
      paymentRecord,
    },
  });
});








export const confirmPaymentAPI = catchAsync(async (req: Request, res: Response) => {
  const { paymentIntentId, paymentMethodId } = req.body;

  if (!paymentIntentId || !paymentMethodId) {
    throw new AppError(httpStatus.BAD_REQUEST, "PaymentIntent ID and PaymentMethod ID are required");
  }

  // Retrieve the PaymentIntent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent) {
    throw new AppError(httpStatus.NOT_FOUND, "PaymentIntent not found");
  }

  // Confirm the payment
  const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId, // Example: "pm_card_visa" for test
  });

  // Update the payment record in database
  const paymentRecord = await PaymentModel.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    {
      paymentStatus: confirmedPayment.status === "succeeded" ? "paid" : "pending",
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    paymentIntent: confirmedPayment.id,
    status: confirmedPayment.status,
    paymentRecord,
  });
});