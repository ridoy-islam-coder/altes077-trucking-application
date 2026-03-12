import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { USER_ROLE } from "../user/user.constant";
import {  confirmPaymentAPI, payForRideAPI } from "./payment.controller";


const router = Router();

// User pay for a ride
router.post("/ride/:rideId",auth( USER_ROLE.USER), payForRideAPI);

// ✅ ঠিক
router.post("/confirm",auth( USER_ROLE.USER), confirmPaymentAPI);

export const PaymentRoutes = router;
