import AppError from "../../error/AppError";
import  httpStatus  from 'http-status';
import { DriverModel } from "./dirver.model";
import { DriverCreateBasicInput, driverCreateBasicSchema } from "./driver.valedition";
import { uploadToS3 } from "../../utils/fileHelper";
import axios from "axios";
import config from "../../config";
import User from "../user/user.model";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { RideModel } from "../ride/ride.model";






/* =========================
   Create Driver (No Images)
========================= */
export const driverCreateService = async (userId: string, data: {
  vehicleType: string;
  vehicleCapacity: string;
  vehicleColor: Number;
  hourRate: number;
 
}) => {
  const existingDriver = await DriverModel.findOne({ userId });
  if (existingDriver) throw new AppError(httpStatus.BAD_REQUEST, 'Driver already exists for this user');

  const driver = await DriverModel.create({
    userId,
    vehicleType: data.vehicleType,
    vehicleCapacity: data.vehicleCapacity,
    vehicleColor: data.vehicleColor,
    hourRate: data.hourRate,
    // location: { type: 'Point', coordinates: data.location.coordinates },
    status: 'inactive',
    images: [], // initially empty
  });

  return driver;
};







const MAX_IMAGES = 4;

export const driverUploadImageService = async (driverId: string, file: Express.Multer.File) => {
  const driver = await DriverModel.findById(driverId);
  if (!driver) throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');

  if (driver.images.length >= MAX_IMAGES) throw new AppError(httpStatus.BAD_REQUEST, `Cannot upload more than ${MAX_IMAGES} images`);

  // const { id, url } = await uploadToS3(file, `driver-${driverId}-${Date.now()}`);
  const { id, url } = await uploadToS3(file,`driver-${driverId}-${Date.now()}`);
  driver.images.push({ id, url });
  await driver.save();

  return driver;
};







/**
 * Save uploaded image info in DB
 */


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



export const getCaptainsInThedriver = async (
  lat: number,
  lng: number,
  radius: number,
  type: string
) => {
  if (!lat || !lng || !radius) throw new Error("Latitude, longitude, and radius are required");

  const query = {
    status: "active",    // ✅ only active drivers
    vehicleType: type,          // ✅ only the type provided by user
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / 6371], // lng first for GeoJSON
      },
    },
  };

  const captains = await DriverModel.find(query);
  // ✅ No drivers found message via sendResponse
  if (captains.length === 0) {
    return {
      statusCode: httpStatus.OK,
      success: true,
      message: "No active drivers found for the given type and location",
      data: [],
    };
  }
  return captains;
};





// export interface DistanceTimeResult {
//   distance: {
//     text: string;
//     value: number;
//   };
//   duration: {
//     text: string;
//     value: number;
//   };
//   status: string;
// }

//  const getDistanceTime = async (
//   origin: string,
//   destination: string
// ): Promise<DistanceTimeResult> => {
//   if (!origin || !destination) {
//     throw new Error("Origin and destination are required");
//   }

//   const apiKey =GOOGLE_MAPS_API;
//   if (!apiKey) {
//     throw new Error("Google Maps API key not found");
//   }

//   const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
//     origin
//   )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

//   const response = await axios.get(url);

//   if (response.data.status !== "OK") {
//     throw new Error("Unable to fetch distance and time");
//   }

//   const element = response.data.rows[0].elements[0];

//   if (element.status === "ZERO_RESULTS") {
//     throw new Error("No routes found");
//   }

//   return element;
// };


const getDistanceTime = async (
  origin: string,
  destination: string
): Promise<any> => {

  const apiKey = GOOGLE_MAPS_API;

  if (!apiKey) {
    throw new Error("Google Maps API key not found");
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;

  const response = await axios.get(url, {
    params: {
      origins: origin,          // example: "23.81,90.41"
      destinations: destination, // example: "23.70,90.37"
      key: apiKey,
    },
  });

  const data = response.data;

  if (data.status !== "OK") {
    throw new Error("Google API error");
  }

  const element = data.rows[0].elements[0];

  if (element.status !== "OK") {
    throw new Error("No route found");
  }

  return {
    distanceText: element.distance.text,
    distanceValue: element.distance.value,
    durationText: element.duration.text,
    durationValue: element.duration.value,
  };
};









export const getcalcutorprice = async (
  lat: number,
  lng: number,
  radius: number,
  type: string,
  userId: string
) => {

  const captains = await DriverModel.find({
    status: "active",
    vehicleType: type,
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / 6371],
      },
    },
  });

  if (captains.length === 0) {
    return {
      message: "No active drivers found",
      data: [],
    };
  }

  const driver = captains[0];

  // example duration
  const hours = 20 / 60;

  const fare = Math.ceil(driver.hourRate * hours);

  // ✅ Ride save using token userId
  const ride = await RideModel.create({
    userId,
    driverId: driver._id,

    pickupLocation: {
      lat,
      lng,
      address: "Pickup Location",
    },

    dropLocation: {
      lat,
      lng,
      address: "Drop Location",
    },

    distance: 0,
    duration: 1200,
    fare,
  });

  return {
    captains,
    ride,
  };
};



















export const getSuggestions = async (
  lat: string,
  lng: string
): Promise<string[]> => {

  if (!lat || !lng) throw new Error("Latitude and longitude are required");

  const apiKey =GOOGLE_MAPS_API;
  if (!apiKey) throw new Error("Google Maps API key not found");

  // Using Nearby Search API instead of Autocomplete
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&key=${apiKey}`;

  const response = await axios.get(url);

  if (response.data.status !== "OK") {
    throw new Error(response.data.error_message || "Unable to fetch suggestions");
  }

  // Map to place names
  return response.data.results
    .map((place: any) => place.name)
    .filter(Boolean);
};



export const getAutoCompleteSuggestions = async (
   input: string,
  lat?: string,
  lng?: string
): Promise<string[]> => {

  if (!input) {
    throw new Error("Query is required");
  }

  const apiKey = GOOGLE_MAPS_API;

  if (!apiKey) {
    throw new Error("Google Maps API key not found");
  }

  let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

  // optional location bias
  if (lat && lng) {
    url += `&location=${lat},${lng}&radius=50000`;
  }

  const response = await axios.get(url);

  if (response.data.status !== "OK") {
    throw new Error("Unable to fetch suggestions");
  }

  return response.data.predictions
    .map((prediction: any) => prediction.description)
    .filter(Boolean);
};




// /* ================= Auto Complete ================= */

// export const getAutoCompleteSuggestions = async (
//   input: string
// ): Promise<string[]> => {
//   if (!input) {
//     throw new Error("Query is required");
//   }

//   const apiKey = GOOGLE_MAPS_API;
//   if (!apiKey) {
//     throw new Error("Google Maps API key not found");
//   }

//   const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
//     input
//   )}&key=${apiKey}`;

//   const response = await axios.get(url);

//   if (response.data.status !== "OK") {
//     throw new Error("Unable to fetch suggestions");
//   }

//   return response.data.predictions
//     .map((prediction: any) => prediction.description)
//     .filter(Boolean);
// };

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

// export const getCaptainsInTheRadius = async (lat: number, lng: number, radius: number) => {
//   if (!lat || !lng || !radius) throw new Error("Latitude, longitude and radius are required");

//   const captains = await DriverModel.find({
//     location: {
//       $geoWithin: {
//         $centerSphere: [[lng, lat], radius / 6371], // ✅ lng first
//       },
//     },
//   });

//   return captains;
// };




const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  if (lat === undefined || lng === undefined) {
    throw new Error("Latitude and longitude are required");
  }

  const apiKey = GOOGLE_MAPS_API;
  if (!apiKey) throw new Error("Google Maps API key not found");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  const response = await axios.get(url);

  if (response.data.status !== "OK" || !response.data.results.length) {
    throw new Error("Unable to fetch address");
  }

  return response.data.results[0].formatted_address;
};






// export const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
//   if (lat === undefined || lng === undefined) {
//     throw new Error("Latitude and longitude are required");
//   }

//   if (!GOOGLE_MAPS_API) throw new Error("Google Maps API key not found");

//   const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API}`;

//   const response = await axios.get(url);

//   if (response.data.status !== "OK" || !response.data.results.length) {
//     throw new Error("Unable to fetch address");
//   }

//   const result = response.data.results[0];

//   // শুধু যা দরকার সেই অংশ extract করি
//   let city = "";
//   let country = "";

//   result.address_components.forEach((comp: any) => {
//     if (comp.types.includes("locality") || comp.types.includes("sublocality_level_1")) {
//       city = comp.long_name;
//     }
//     if (comp.types.includes("country")) {
//       country = comp.long_name;
//     }
//   });

//   // যদি city না পাওয়া যায়, fallback to formatted_address
//   if (!city) city = result.formatted_address;

//   return `${city}, ${country}`; // উদাহরণ: "Dhaka, Bangladesh"
// };




export const getExactStreetAddress = async (lat: number, lng: number): Promise<string> => {
  if (lat === undefined || lng === undefined) {
    throw new Error("Latitude and longitude are required");
  }

  if (!GOOGLE_MAPS_API) throw new Error("Google Maps API key not found");

  try {
    // Try with street address type first
    let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=street_address&key=${GOOGLE_MAPS_API}`;
    let res = await fetch(url);
    let data = await res.json();

    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    // Fallback to normal reverse geocode
    url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API}`;
    res = await fetch(url);
    data = await res.json();

    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    return "Address not found";
  } catch (error) {
    console.error("Geocode error:", error);
    return "Address error";
  }
};


export const driverServices = {
  driverCreateService,  
  driverUploadImageService,
  getDistanceTime,
  getAutoCompleteSuggestions,
  getSuggestions,
  // getCaptainsInTheRadius,
  getCaptainsInThedriver,
  getAddressCoordinate,
  getAddressFromCoordinates,
  getcalcutorprice,
};