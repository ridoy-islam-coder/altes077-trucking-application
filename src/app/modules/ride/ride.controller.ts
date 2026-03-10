// // fare.ts

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DriverModel } from "../drivermodel/dirver.model";
import User from "../user/user.model";
import { RideModel } from "./ride.model";
import { rideServices } from "./ride.service";

// export const createRideController = catchAsync(async (req, res) => {
//   const { pickupLocation, dropLocation, driverId } = req.body;

//   if (!pickupLocation || !dropLocation || !driverId) {
//     return sendResponse(res, {
//       statusCode: 400,
//       success: false,
//       message: "Pickup, drop location and driverId are required",
//       data: null,
//     });
//   }


  


//   // Step 1: Find the driver
//   const driver = await DriverModel.findById(driverId);
//   if (!driver) {
//     return sendResponse(res, {
//       statusCode: 404,
//       success: false,
//       message: "Driver not found",
//       data: null,
//     });
//   }

//   // Step 2: Get distance & duration from Google API
//   const origin = `${pickupLocation.lat},${pickupLocation.lng}`;
//   const destination = `${dropLocation.lat},${dropLocation.lng}`;
//   const result = await rideServices.getDistanceTime(origin, destination);

//   const durationHours = result.durationValue / 3600; // seconds -> hours

//   // Step 3: Calculate fare using driver's hourRate
//   const fare = durationHours * driver.hourRate;

//   // Check for NaN
//   if (isNaN(fare)) {
//     console.error({ durationHours, hourRate: driver.hourRate, driver });
//     throw new Error("Fare calculation failed");
//   }

//   // Step 4: Save ride to DB
//   const ride = await RideModel.create({
//     userId: req.user.id,
//     driverId: driver._id,
//     pickupLocation,
//     dropLocation,
//     distance: result.distanceValue,
//     duration: result.durationValue,
//     fare,
//     status: "pending",
//   });

//   sendResponse(res, {
//     statusCode: 201,
//     success: true,
//     message: "Ride created successfully",
//     data: ride,
//   });
// });










// export const createRideController = catchAsync(async (req, res) => {
//   const { pickupLocation, dropLocation, driverId } = req.body;

//   if (!pickupLocation || !dropLocation || !driverId) {
//     return sendResponse(res, {
//       statusCode: 400,
//       success: false,
//       message: "Pickup, drop location and driverId are required",
//       data: null,
//     });
//   }

//   // Step 1: Find the driver
//   const driver = await DriverModel.findById(driverId);
//   if (!driver) {
//     return sendResponse(res, {
//       statusCode: 404,
//       success: false,
//       message: "Driver not found",
//       data: null,
//     });
//   }

//   // Step 2: Get distance & duration from Google API
//   const origin = `${pickupLocation.lat},${pickupLocation.lng}`;
//   const destination = `${dropLocation.lat},${dropLocation.lng}`;
//   const result = await driverServices.getDistanceTimeController(origin, destination);

//   const durationHours = result.durationValue / 3600; // seconds -> hours

//   // Step 3: Calculate fare using driver's hourRate
//   const fare = durationHours * driver.hourRate;

//   // Check for NaN
//   if (isNaN(fare)) {
//     console.error({ durationHours, hourRate: driver.hourRate, driver });
//     throw new Error("Fare calculation failed");
//   }

//   // Step 4: Save ride to DB
//   const ride = await RideModel.create({
//     userId: req.user.id,
//     driverId: driver._id,
//     pickupLocation,
//     dropLocation,
//     distance: result.distanceValue,
//     duration: result.durationValue,
//     fare,
//     status: "pending",
//   });

//   sendResponse(res, {
//     statusCode: 201,
//     success: true,
//     message: "Ride created successfully",
//     data: ride,
//   });
// });








export const createRideController = catchAsync(
  async (req, res) => {

    const userId = req.user.id;
    const { pickupLocation, dropLocation, distance, duration, driverId } = req.body;

    if (!pickupLocation || !dropLocation || !distance || !duration || !driverId) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "All fields including driverId are required",
        data: null,
      });
    }

   

    const ride = await rideServices.createRide({
      userId,
      pickupLocation,
      dropLocation,
      distance,
      duration,
      driverId,
    });
    console.log("🚀 ~ file: ride.controller.ts:63 ~ createRideController ~ ride:", ride);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Ride created successfully",
      data: ride,
    });
  }
);


export const getRideByIdController = catchAsync(async (req, res) => {
  const rideId = req.params.id;

  const ride = await RideModel.findById(rideId);
  if (!ride) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: 'Ride not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Ride details fetched successfully',
    data: ride,
  });
});






export const addPickupScheduleController = catchAsync(
  async (req, res) => {
    const userId = req.user.id;
    const { pickupTime, pickupDate,userNotes } = req.body;

    if (!pickupTime || !pickupDate || !userNotes) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "pickupTime, pickupDate, and userNotes are required",
        data: null,
      });
    }

    // ✅ find latest created ride of this user
    const latestRide = await RideModel.findOne({
      userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (!latestRide) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "No pending ride found",
        data: null,
      });
    }

    // ✅ update pickup schedule
    latestRide.pickupTime = pickupTime;
    latestRide.pickupDate = pickupDate;
    latestRide.userNotes = userNotes;

    await latestRide.save();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Pickup schedule added successfully",
      data: latestRide,
    });
  }
);


export const listRidesController = catchAsync(async (req, res) => {
  const { userId, driverId } = req.query;

  if (!userId && !driverId) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'userId or driverId query param is required',
      data: null,
    });
  }

  const filter: any = {};
  if (userId) filter.userId = userId;
  if (driverId) filter.driverId = driverId;

  const rides = await RideModel.find(filter).sort({ createdAt: -1 });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Rides fetched successfully',
    data: rides,
  });
});



export const updateRideStatusController = catchAsync(async (req, res) => {
  const rideId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Status is required',
      data: null,
    });
  }

  const ride = await RideModel.findByIdAndUpdate(
    rideId,
    { status, updatedAt: new Date() },
    { new: true }
  );

  if (!ride) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: 'Ride not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Ride status updated successfully',
    data: ride,
  });
});



/* =========================
Driver accepts ride
PATCH /rides/:id/accept
========================= */
export const acceptRideController = catchAsync(async (req, res) => {
  const ride = await RideModel.findById(req.params.id);
  if (!ride) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Ride not found",
      data: null,
    });
  }

  if (ride.status !== "pending") {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Ride cannot be accepted",
      data: null,
    });
  }

  ride.status = "accepted";
  ride.driverId = req.user.id;
  ride.updatedAt = new Date();
  await ride.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Ride accepted successfully",
    data: ride,
  });
});

/* =========================
Ride starts
PATCH /rides/:id/start
========================= */
export const startRideController = catchAsync(async (req, res) => {
  const ride = await RideModel.findById(req.params.id);
  if (!ride) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Ride not found",
      data: null,
    });
  }

  if (ride.status !== "accepted") {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Ride cannot be started",
      data: null,
    });
  }

  ride.status = "ongoing"; // type-safe now
  ride.startedAt = new Date();
  ride.updatedAt = new Date();
  await ride.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Ride started successfully",
    data: ride,
  });
});

/* =========================
Ride completes
PATCH /rides/:id/complete
========================= */

export const completeRideController = catchAsync(async (req, res) => {
  const ride = await RideModel.findById(req.params.id);
  if (!ride) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Ride not found",
      data: null,
    });
  }

  // এখন status type-safe
  if (ride.status !== "ongoing") {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Ride cannot be completed",
      data: null,
    });
  }

  ride.status = "completed";
  ride.completedAt = new Date();
  ride.updatedAt = new Date();
  await ride.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Ride completed successfully",
    data: ride,
  });
});






export const cancelRideController = catchAsync(async (req, res) => {
  const ride = await RideModel.findById(req.params.id);

  if (!ride) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Ride not found",
      data: null,
    });
  }

  if (ride.status === "completed" || ride.status === "cancel") {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Ride cannot be cancel",
      data: null,
    });
  }

  ride.status = "cancel";
  ride.updatedAt = new Date();
  await ride.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Ride cancelled successfully",
    data: ride,
  });
});



export const adjustFareController = catchAsync(async (req, res) => {
  const { fare } = req.body;
  if (fare == null || isNaN(fare)) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Invalid fare",
      data: null,
    });
  }

  const ride = await RideModel.findById(req.params.id);
  if (!ride) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Ride not found",
      data: null,
    });
  }

  ride.fare = fare;
  ride.updatedAt = new Date();
  await ride.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Fare adjusted successfully",
    data: ride,
  });
});



export const rateDriverController = catchAsync(async (req, res) => {
  const { rating, review } = req.body;

  if (rating == null || rating < 1 || rating > 5) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Rating must be between 1 and 5",
      data: null,
    });
  }

  const ride = await RideModel.findById(req.params.id);
  if (!ride) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Ride not found",
      data: null,
    });
  }

  ride.driverRating = rating;
  ride.driverReview = review || "";
  ride.updatedAt = new Date();
  await ride.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Driver rated successfully",
    data: ride,
  });
});
export const nearbyDriversController = catchAsync(async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query; // radius in meters

  if (!lat || !lng) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Latitude and longitude are required",
      data: null,
    });
  }

  // MongoDB geospatial query
  const drivers = await User.find({
    role: "DRIVER",
    isActive: true,
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radius),
      },
    },
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Nearby drivers fetched successfully",
    data: drivers,
  });
});



export const ridecontroller = {
 createRideController,  
 getRideByIdController,
  listRidesController,
  updateRideStatusController,
    acceptRideController,
  startRideController,
  completeRideController,
    cancelRideController,
    adjustFareController,
    addPickupScheduleController,
    rateDriverController,
    nearbyDriversController
};

