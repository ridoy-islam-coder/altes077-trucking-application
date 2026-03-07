import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { driverServices, getExactStreetAddress } from "./driver.service.";
import httpStatus  from 'http-status';
import { DriverCreateBasicInput } from "./driver.valedition";
import AppError from "../../error/AppError";
import { DriverModel } from "./dirver.model";
import User from "../user/user.model";




export const createDriver = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userId = req.user.id;

  const { vehicleType, vehicleNumber, vehicleCapacity, vehicleColor, hourRate, location } = req.body;

  if (!vehicleType || !vehicleNumber || !vehicleCapacity || !vehicleColor || !hourRate || !location?.coordinates) {
    throw new AppError(httpStatus.BAD_REQUEST, 'All driver fields are required');
  }
  
  const driver = await driverServices.driverCreateService(userId, {
    vehicleType,
    vehicleNumber,
    vehicleCapacity,
    vehicleColor,
    hourRate,
    location,
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




//  const updateDriverLocationByAddress = catchAsync(async (req, res) => {
//     const { address } = req.body;

//     if (!address) {
//       throw new AppError(400, 'Address is required');
//     }

//     const result =
//       await driverServices.updateLocationFromAddress(
//         req.user.id,
//         address,
//       );

//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: 'Location updated successfully',
//       data: result,
//     });
//   },
// );


// AIzaSyCB3G-ob1C6JEUF_wotuQY1RMPKIbRkPIw










const getCoordinatesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      res.status(400).json({
        success: false,
        message: "Address is required",
      });
      return;
    }

    const coordinates = await driverServices.getAddressCoordinate(address);

    res.status(200).json({
      success: true,
      data: coordinates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};





/* ===== Distance & Time ===== */
 const getDistanceTimeController = async (
  req: Request,
  res: Response
) => {
  try {
    const { origin, destination } = req.query;

    const result = await driverServices.getDistanceTime(
      origin as string,
      destination as string
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

/* ===== Auto Complete ===== */
 const getAutoCompleteController = async (
  req: Request,
  res: Response
) => {
  try {
    const { input } = req.query;

    const suggestions = await driverServices.getAutoCompleteSuggestions(input as string);

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

/* ===== Captains in Radius ===== */
 const getCaptainsInRadiusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { ltd, lng, radius } = req.query;

    const captains = await driverServices.getCaptainsInTheRadius(
      Number(ltd),
      Number(lng),
      Number(radius)
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
  getDistanceTimeController,
  getAutoCompleteController,
  getCaptainsInRadiusController,
  createDriver,
  // uploadDriverImage,
  uploadMultipleDriverImages,
  getCoordinatesController,
  getAddressFromCoordinatesController,
  getExactStreetAddressController,
};




