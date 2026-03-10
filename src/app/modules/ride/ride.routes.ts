import { Router } from "express";
import { ridecontroller } from "./ride.controller";
import { USER_ROLE } from "../user/user.constant";
import auth from "../../middleware/auth.middleware";




const router = Router();

/* =========================
Create Ride
========================= */
router.post('/create-ride', auth(USER_ROLE.USER), ridecontroller.createRideController,);

router.patch("/add-timedate",auth(USER_ROLE.USER),ridecontroller.addPickupScheduleController);
/* =========================
Get Ride by ID
GET /rides/:id
========================= */
router.get(
  "/rides-data/:id",
 auth(USER_ROLE.USER, USER_ROLE.DRIVER),
  ridecontroller.getRideByIdController
);

/* =========================
List Rides for a User or Driver
GET /rides?userId=xxx or GET /rides?driverId=xxx
========================= */
router.get(
  "/allrides",
  auth(USER_ROLE.USER),
  ridecontroller.listRidesController
);

/* =========================
Update Ride Status
PATCH /rides/:id/status
========================= */
router.patch(
  "/update-status/:id",
  auth(USER_ROLE.USER, USER_ROLE.DRIVER),
  ridecontroller.updateRideStatusController
);
/* =========================
Future Ride APIs
========================= */
// Get all rides for user
// router.get("/", authenticateUser, getAllRidesController);

// Get single ride
// router.get("/:id", authenticateUser, getSingleRideController);

// Driver accepts ride
// router.patch("/:id/accept", authenticateDriver, acceptRideController);

// Ride starts
// router.patch("/:id/start", authenticateDriver, startRideController);

// Ride completes
// router.patch("/:id/complete", authenticateDriver, completeRideController);



/* =========================
Driver APIs
========================= */
router.patch("/status/:id/accept", auth(USER_ROLE.DRIVER), ridecontroller.acceptRideController);
// router.patch("/status/:id/start", auth(USER_ROLE.DRIVER), ridecontroller.startRideController);
router.patch("/status/:id/complete", auth(USER_ROLE.DRIVER), ridecontroller.completeRideController);




/* Cancel ride by user */
router.patch("/rides/:id/cancel", auth(USER_ROLE.USER,USER_ROLE.DRIVER),ridecontroller.cancelRideController);

/* Adjust fare / refund */
router.patch("/rides/:id", auth(USER_ROLE.USER), ridecontroller.adjustFareController);

/* Rate driver / add review */
router.patch("/review/:id", auth(USER_ROLE.USER), ridecontroller.rateDriverController);

/* Nearby drivers search */
router.get("/drivers/nearby", auth(USER_ROLE.USER, USER_ROLE.DRIVER), ridecontroller.nearbyDriversController);




export const authride = router;
