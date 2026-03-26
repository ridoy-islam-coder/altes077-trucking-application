import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { driverServices, getExactStreetAddress } from "./driver.service.";
import httpStatus  from 'http-status';
import { DriverCreateBasicInput } from "./driver.valedition";
import AppError from "../../error/AppError";
import { DriverModel } from "./dirver.model";
import User from "../user/user.model";
import { RideModel } from "../ride/ride.model";
import { calculateFareByHour,  estimateDurationMin, getDistanceInKm } from "../../utils/calculateFare";




export const createDriver = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userId = req.user.id;

  const { vehicleType,  vehicleCapacity, vehicleColor, hourRate } = req.body;

  if (!vehicleType || !vehicleCapacity || !vehicleColor || !hourRate) {
    throw new AppError(httpStatus.BAD_REQUEST, 'All driver fields are required');
  }
  
  const driver = await driverServices.driverCreateService(userId, {
    vehicleType,
    vehicleCapacity,
    vehicleColor,
    hourRate,
   
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Driver created successfully',
    data: driver,
  });
});






export const uploadMultipleDriverImages = catchAsync(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) throw new AppError(httpStatus.BAD_REQUEST, 'No files uploaded');
    if (!req.user || !req.user.id) throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');

    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

    // Find driver linked to this user
    const driver = await DriverModel.findOne({ userId: user._id });
    if (!driver) throw new AppError(httpStatus.NOT_FOUND, 'Driver profile not found');

    const uploadedDrivers = [];
    for (const file of files) {
      const uploaded = await driverServices.driverUploadImageService(driver._id.toString(), file);
      uploadedDrivers.push(uploaded);
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Driver images uploaded successfully',
      data: uploadedDrivers,
    });
  }
);

 const getAllDrivers = catchAsync(async (req: Request, res: Response) => {
  // সব driver data fetch + related user data
  const drivers = await DriverModel.find()
    .populate({
      path: "userId",      // Driver model এ যেটা ref করা আছে
      select: "_id email fullName phoneNumber countryCode role isVerified", // শুধু প্রয়োজনীয় user fields
    })
    .lean(); // lean() দিলে lightweight JS objects পাবে

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All drivers with user data fetched successfully",
    data: drivers,
  });
});




 const getUserAndDriverData = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // auth middleware থেকে আসা user id
  if (!userId) throw new Error("User not authenticated");

  // User data
  const user = await User.findById(userId)
    .select("_id email fullName phoneNumber countryCode role isVerified")
    .lean();
  if (!user) throw new Error("User not found");

  // Driver data linked to this user
  const driver = await DriverModel.findOne({ userId })
    .lean();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User and driver data fetched successfully",
    data: { user, driver },
  });
});




export const getCaptainsInRadiusController = async (req: Request, res: Response) => {
  try {
    const { ltd, lng, radius, type } = req.query;

    // ✅ Check required query params
    if (!ltd || !lng || !radius) {
      return res.status(400).json({
        success: false,
        message: "Latitude, longitude, and radius are required",
      });
    }

    // ✅ Check if type is provided
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Driver type is required to fetch drivers",
      });
    }

    const captains = await driverServices.getCaptainsInThedriver(
      Number(ltd),
      Number(lng),
      Number(radius),
      type as string
    );

 
    res.status(200).json({
      success: true,
      data: captains,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};















export const getcalcutorfar = async (
  req: Request,
  res: Response
) => {
  try {
    const { ltd, lng, radius, type } = req.query;
  // ✅ token থেকে userId
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // ✅ userId from token
     const userId = req.user.id;

    if (!ltd || !lng || !radius) {
      return res.status(400).json({
        success: false,
        message: "Latitude, longitude, and radius are required",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Driver type is required",
      });
    }

    const result = await driverServices.getcalcutorprice(
      Number(ltd),
      Number(lng),
      Number(radius),
      type as string,
      userId // ✅ pass token user
    );

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};







export const createDynamicRideWithDistance = catchAsync(async (req: Request, res: Response) => {
  const { pickupLat, pickupLng, dropLat, dropLng, radius, vehicleType } = req.query;
  const { scheduleDate, scheduleTime, workNotes } = req.body; // ✅ Add from frontend
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!pickupLat || !pickupLng || !dropLat || !dropLng || !radius || !vehicleType) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  // Step 1: Find all active & approved drivers with this vehicleType
  const drivers = await DriverModel.find({
    status: "active",
    isApproved: true,
    vehicleType,
  }).lean();

  if (!drivers.length) {
    return res.status(404).json({ success: false, message: "No driver available nearby" });
  }

  // Step 2: Check each driver location from UserModel
  let nearbyDriver: any = null;
  for (const driver of drivers) {
    const user = await User.findById(driver.userId).lean();
    if (!user?.location?.coordinates) continue;

    const [lng, lat] = user.location.coordinates;
    const distance = getDistanceInKm(Number(pickupLat), Number(pickupLng), lat, lng);

    if (distance <= Number(radius)) {
      nearbyDriver = { driver, location: user.location };
      break;
    }
  }

  if (!nearbyDriver) {
    return res.status(404).json({ success: false, message: "No driver available nearby" });
  }

  const driver = nearbyDriver.driver;

  // Step 3: Calculate distance & duration for ride
  const distanceKm = getDistanceInKm(Number(pickupLat), Number(pickupLng), Number(dropLat), Number(dropLng));
  const durationMin = estimateDurationMin(distanceKm);
  const fare = calculateFareByHour(driver.hourRate, durationMin);

  // Step 4: Create ride with schedule & notes
  const ride = await RideModel.create({
    userId,
    driverId: driver._id,
    driveruserID: driver.userId,
    vehicleType: driver.vehicleType,
    distance: distanceKm,
    duration: durationMin,
    fare,
    pickupLocation: {
      type: "Point",
      coordinates: [Number(pickupLng), Number(pickupLat)],
      address: "Pickup Address",
    },
    dropLocation: {
      type: "Point",
      coordinates: [Number(dropLng), Number(dropLat)],
      address: "Drop Address",
    },
    scheduleDate: scheduleDate ? new Date(scheduleDate) : null, // ✅ Date from frontend
    scheduleTime: scheduleTime || null, // ✅ Time string
    workNotes: workNotes || "", // ✅ Notes
  });

  // Step 5: Response
  res.status(200).json({
    success: true,
    message: "Ride created successfully",
    data: { driver, ride },
  });
});



















































export const getAutoSuggestions = async (
  req: Request,
  res: Response,

) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) throw new AppError(httpStatus.BAD_REQUEST, "Latitude and longitude are required");

    const suggestions = await driverServices.getSuggestions(
      lat as string,
      lng as string
    );

    res.status(200).json({
      success: true,
      data: suggestions,
    });

  } catch (error: any) {
     res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};













const getAutoCompleteController = async (
  req: Request,
  res: Response
) => {
  try {
    const { input, lat, lng } = req.query;

    const suggestions = await driverServices.getAutoCompleteSuggestions(
      input as string,
      lat as string,
      lng as string
    );

    res.status(200).json({
      success: true,
      data: suggestions,
    });

  } catch (error: any) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};








// /* ===== Distance & Time ===== */
// const getDistanceTimeController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const { origin, destination } = req.query;

//     if (!origin || !destination) {
//       return res.status(400).json({
//         success: false,
//         message: "Origin and destination are required",
//       });
//     }

//     const result = await driverServices.getDistanceTime(
//       origin as string,
//       destination as string
//     );

//     res.status(200).json({
//       success: true,
//       data: result,
//     });

//   } catch (error: any) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };


const getDistanceTimeController = async (
  req: Request,
  res: Response
) => {
  try {
    // ✅ query থেকে নিচ্ছি
    const { origin, destination } = req.query;

    // ✅ token থেকে userId
    const userId = req.user.id;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination required",
      });
    }

    // distance api call
    const result = await driverServices.getDistanceTime(
      origin as string,
      destination as string
    );

    // coordinates split
    const [pickupLat, pickupLng] = (origin as string).split(",");
    const [dropLat, dropLng] = (destination as string).split(",");

    // ✅ Ride create
    const ride = await RideModel.create({
      userId,

      pickupLocation: {
        lat: Number(pickupLat),
        lng: Number(pickupLng),
        address: "Pickup Location",
      },

      dropLocation: {
        lat: Number(dropLat),
        lng: Number(dropLng),
        address: "Drop Location",
      },

      distance: result.distanceValue,
      duration: result.durationValue,
      distanceText: result.distanceText,
      durationText: result.durationText,
   

      // example fare calculation
      fare: Math.round((result.distanceValue / 1000) * 20),
    });

    res.status(200).json({
      success: true,
      data: ride,
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


















export const getDriversByVehicleTypeController = catchAsync(
  async (req, res) => {
    const { vehicleType } = req.query;

    let filter: any = {
      status: "active",
    };

    // ✅ If NOT All → filter apply
    if (vehicleType && vehicleType !== "All") {
      filter.vehicleType = vehicleType;
    }

    const drivers = await DriverModel.find(filter)
      .populate("userId")
      .sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Vehicle list fetched successfully",
      data: drivers,
    });
  }
);

export const getAddressFromCoordinatesController = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const address = await driverServices.getAddressFromCoordinates(lat, lng);

    res.json({
      success: true,
      data: { address },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};



export const getExactStreetAddressController = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const address = await getExactStreetAddress(lat, lng);

    res.json({
      success: true,
      data: { address },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};


export const driverController = {
  createDynamicRideWithDistance,

  getAutoCompleteController,
  getCaptainsInRadiusController,
  createDriver,
  getUserAndDriverData,
  getAllDrivers,
  getDistanceTimeController,
  getAutoSuggestions,
  // uploadDriverImage,
  getDriversByVehicleTypeController,
  uploadMultipleDriverImages,
   getAddressFromCoordinatesController,
  getExactStreetAddressController,
  getcalcutorfar,
};




