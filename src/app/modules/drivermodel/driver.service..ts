import AppError from "../../error/AppError";
import  httpStatus  from 'http-status';
import { DriverModel } from "./dirver.model";
import { DriverCreateBasicInput, driverCreateBasicSchema } from "./driver.valedition";
import { uploadToS3 } from "../../utils/fileHelper";
import axios from "axios";
import config from "../../config";




const driverCreateService = async (
  userId: string,
  driverData: DriverCreateBasicInput
) => {
  // 🔹 Validate request body
  const parsed = driverCreateBasicSchema.safeParse(driverData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Validation failed';
    throw new AppError(httpStatus.BAD_REQUEST, message);
  }

  // 🔹 Check if driver already exists for this user
  const alreadyExists = await DriverModel.findOne({ userId });
  if (alreadyExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Driver has already been created for this user'
    );
  }

  // 🔹 Create driver
  const driver = await DriverModel.create({
    ...parsed.data,
    userId,
  });

  return driver;
};



 const driverUploadImageService = async (
  userId: string,
  file: Express.Multer.File
) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'File is required');
  }

  const driver = await DriverModel.findOne({ userId });
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
  }

  // Upload file to S3
  const { id, url } = await uploadToS3(file, `driver-${userId}`);

  // Save in DB
  driver.image = { id, url };
  await driver.save();

  return driver;
};




//  const updateLocationFromAddress = async (
//   userId: string,
//   address: string,
// ) => {
//   // 🔹 Google Geocoding API
//   const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json`;

//   const response = await axios.get(googleUrl, {
//     params: {
//       address,
//       key: config.google_maps_api_key,
//     },
//   });

//   if (
//     response.data.status !== 'OK' ||
//     !response.data.results.length
//   ) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Invalid address');
//   }

//   const location = response.data.results[0].geometry.location;

//   const driver = await DriverModel.findOne({ userId });
//   if (!driver) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
//   }

//   driver.location = {
//     lat: location.lat,
//     lng: location.lng,
//   };

//   await driver.save();

//   return driver.location;
// };






 const GOOGLE_MAPS_API="AIzaSyCB3G-ob1C6JEUF_wotuQY1RMPKIbRkPIw"




interface Coordinates {
  lat: number;
  lng: number;
}

 const getAddressCoordinate = async (
  address: string
): Promise<Coordinates> => {
  const apiKey =GOOGLE_MAPS_API;

  if (!apiKey) {
    throw new Error("Google Maps API key not found");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  const response = await axios.get(url);

  if (response.data.status !== "OK") {
    throw new Error("Unable to fetch coordinates");
  }

  const location = response.data.results[0].geometry.location;

  return {
    lat: location.lat,
    lng: location.lng,
  };
};







export interface DistanceTimeResult {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  status: string;
}

 const getDistanceTime = async (
  origin: string,
  destination: string
): Promise<DistanceTimeResult> => {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }

  const apiKey =GOOGLE_MAPS_API;
  if (!apiKey) {
    throw new Error("Google Maps API key not found");
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  const response = await axios.get(url);

  if (response.data.status !== "OK") {
    throw new Error("Unable to fetch distance and time");
  }

  const element = response.data.rows[0].elements[0];

  if (element.status === "ZERO_RESULTS") {
    throw new Error("No routes found");
  }

  return element;
};

/* ================= Auto Complete ================= */

export const getAutoCompleteSuggestions = async (
  input: string
): Promise<string[]> => {
  if (!input) {
    throw new Error("Query is required");
  }

  const apiKey = GOOGLE_MAPS_API;
  if (!apiKey) {
    throw new Error("Google Maps API key not found");
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`;

  const response = await axios.get(url);

  if (response.data.status !== "OK") {
    throw new Error("Unable to fetch suggestions");
  }

  return response.data.predictions
    .map((prediction: any) => prediction.description)
    .filter(Boolean);
};

/* ================= Captains In Radius ================= */
// export const getCaptainsInTheRadius = async (
//   lat: number,
//   lng: number,
//   radius: number // km
// ) => {
//   if (!lat || !lng || !radius) throw new Error("Latitude, longitude and radius are required");

//   const captains = await DriverModel.find({
//     location: {
//       $geoWithin: {
//         $centerSphere: [[lng, lat], radius / 6371], // 👈 fix: lng first
//       },
//     },
//   });

//   return captains;
// };

export const getCaptainsInTheRadius = async (lat: number, lng: number, radius: number) => {
  if (!lat || !lng || !radius) throw new Error("Latitude, longitude and radius are required");

  const captains = await DriverModel.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / 6371], // ✅ lng first
      },
    },
  });

  return captains;
};







export const driverServices = {
  driverCreateService,  
  driverUploadImageService,
  getDistanceTime,
  getAutoCompleteSuggestions,
  getCaptainsInTheRadius,
  getAddressCoordinate,
};