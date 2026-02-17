import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { driverServices } from "./driver.service.";
import httpStatus  from 'http-status';
import { DriverCreateBasicInput } from "./driver.valedition";








export const createDriver = catchAsync(async (req: Request, res: Response) => {
  const driverData: DriverCreateBasicInput = req.body;

  const result = await driverServices.driverCreateService(req.user.id, driverData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Driver created successfully',
    data: result,
  });
});


export const uploadDriverImage = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  const userId = req.user.id;

  const driver = await driverServices.driverUploadImageService(userId, file!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Driver image uploaded successfully',
    data: driver,
  });
});



export const driverController = {
  createDriver,
  uploadDriverImage,
};