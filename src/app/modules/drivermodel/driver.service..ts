import AppError from "../../error/AppError";
import  httpStatus  from 'http-status';
import { DriverModel } from "./dirver.model";
import { DriverCreateBasicInput, driverCreateBasicSchema } from "./driver.valedition";
import { uploadToS3 } from "../../utils/fileHelper";




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











export const driverServices = {
  driverCreateService,  
  driverUploadImageService,
};