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




 const updateLocationFromAddress = async (
  userId: string,
  address: string,
) => {
  // 🔹 Google Geocoding API
  const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json`;

  const response = await axios.get(googleUrl, {
    params: {
      address,
      key: config.google_maps_api_key,
    },
  });

  if (
    response.data.status !== 'OK' ||
    !response.data.results.length
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid address');
  }

  const location = response.data.results[0].geometry.location;

  const driver = await DriverModel.findOne({ userId });
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
  }

  driver.location = {
    lat: location.lat,
    lng: location.lng,
  };

  await driver.save();

  return driver.location;
};

























export const driverServices = {
  driverCreateService,  
  driverUploadImageService,
  updateLocationFromAddress,
};