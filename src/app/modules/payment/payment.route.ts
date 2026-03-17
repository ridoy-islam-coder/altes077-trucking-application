import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { USER_ROLE } from "../user/user.constant";
import {  confirmPaymentAPI, createStripeAccount, payForRideAPI } from "./payment.controller";


const router = Router();

// User pay for a ride
router.post("/ride/:rideId",auth( USER_ROLE.USER), payForRideAPI);

// ✅ ঠিক
router.post("/confirm",auth( USER_ROLE.USER), confirmPaymentAPI);

//driver account setup
router.post("/create-stripe-account", auth(USER_ROLE.DRIVER), createStripeAccount);

export const PaymentRoutes = router;
