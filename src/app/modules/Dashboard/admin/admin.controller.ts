import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import AppError from "../../../error/AppError";
import { Admin } from "./admin.model";
import httpStatus from 'http-status';
import sendResponse from "../../../utils/sendResponse";
import jwt from 'jsonwebtoken';
import { adminService } from "./admin.service";
import config from "../../../config";
import { sendEmail } from "../../../utils/mailSender";
import { uploadToS3 } from "../../../utils/fileHelper";


// import { Request, Response } from 'express';
// import catchAsync from '../../../utils/catchAsync';
// import sendResponse from '../../../utils/sendResponse';
// import httpStatus from 'http-status';
// import { Admin } from './admin.model';

// import config from '../../../config';

// import AppError from '../../../error/AppError';
// import { uploadToS3 } from '../../../utils/fileHelper';




export const adminRegister = catchAsync( async (req: Request, res: Response) => {
    const { email, password, role, fullName, phoneNumber } = req.body;

    // 🔎 Check admin already exists
    const isAdminExist = await Admin.findOne({ email });
    if (isAdminExist) {
      throw new AppError(httpStatus.CONFLICT, 'Admin already exists');
    }

    // 🧾 Create admin (password auto hash হবে)
    const admin = await Admin.create({
      email,
      password,
      role, // admin / super_admin
      fullName,
      phoneNumber,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  },
);












const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin) throw new AppError(httpStatus.NOT_FOUND, 'Admin not found');

  const isMatch = await admin.isPasswordMatched(password);
  if (!isMatch)
    throw new AppError(httpStatus.UNAUTHORIZED, 'Incorrect password');

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    config.jwt.jwt_access_secret as string,
    {
      expiresIn: config.jwt.jwt_access_expires_in as jwt.SignOptions['expiresIn'],
    },
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin login successful',
    data: {
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      token,
    },
  });
});


const getProfile = catchAsync(async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.user.id).select('-password');
  if (!admin) {
    throw new AppError(httpStatus.NOT_FOUND, 'Admin not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin profile retrieved successfully',
    data: admin,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  let image;
  if (req.file) {
    image = await uploadToS3(req.file, 'admin-profile/');
  }

  const result = await adminService.updateAdminProfile(req.user.id, {
    ...req.body,
    ...(image && { image }),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  await adminService.changePassword(
    req.user.id,
    req.body.oldPassword,
    req.body.newPassword,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password changed successfully',
    data: {},
  });
});

const verifiedAdmins = new Map<string, string>();

// global in-memory Map (for demo only)
const otpStore = new Map<string, string>();

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const otp = await adminService.setForgotOtp(req.body.email);
  otpStore.set(otp.toString(), req.body.email); // store otp → email

await sendEmail(
  req.body.email,
  'Admin Password Reset OTP',
  `Your OTP is ${otp}. It is valid for 10 minutes.` // <=== html/string argument
);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP sent successfully, please verify before reset password',
    data: { otp },
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;

  const email = otpStore.get(otp.toString());
  if (!email) {
    throw new AppError(400, 'OTP mismatch or expired');
  }

  await adminService.verifyOtp(email, otp);
  otpStore.delete(otp.toString()); // optional cleanup
  verifiedAdmins.set(email, 'VERIFIED');

  const token = jwt.sign({ email }, config.jwt.jwt_access_secret as string,{
    expiresIn: '15m',
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP verified. Use this token to reset password.',
    data: { token },
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword)
    throw new AppError(400, 'Passwords do not match');

  // Find verified email
  const matchedEmail = [...verifiedAdmins.entries()].find(
    ([email, status]) => status === 'VERIFIED',
  )?.[0];

  if (!matchedEmail) throw new AppError(400, 'OTP not verified');

  await adminService.resetPassword(matchedEmail, newPassword);
  verifiedAdmins.delete(matchedEmail); // Clean up

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password reset successful',
    data: {},
  });
});











const getRideStats = catchAsync(async (req, res) => {
  const result = await adminService.getRideStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Ride statistics retrieved successfully",
    data: result,
  });
});



const getAllDrivers = catchAsync(async (req: Request, res: Response) => {
  const drivers = await adminService.getAllDrivers();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Drivers fetched successfully',
    data: drivers,
  });
});






const getDriverByUserId = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const driver = await adminService.getDriverByUserId(userId as string);

  if (!driver) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: 'Driver not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Driver fetched successfully',
    data: driver,
  });
});

const approveDriver = catchAsync(async (req: Request, res: Response) => {
  const { driverId } = req.params;

  const driver = await adminService.approveDriver(driverId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Driver approved successfully',
    data: driver,
  });
});

const rejectDriver = catchAsync(async (req: Request, res: Response) => {
  const { driverId } = req.params;

  const driver = await adminService.rejectDriver(driverId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Driver rejected successfully',
    data: driver,
  });
});






const getDriverStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await adminService.getDriverStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Driver stats fetched successfully',
    data: stats,
  });
});


const getNewUsersLastWeek = catchAsync(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await adminService.getNewUsersLastWeek(
      page,
      limit,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'New users fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);



const getDriverHoldList = catchAsync(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm as string;

    const result = await adminService.getDriverHoldList(
      page,
      limit,
      searchTerm,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Driver hold list fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);




const getAllRidesliste = catchAsync(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await adminService.getAllRides(page, limit);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Ride list fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);

export const adminControllers = {
  adminRegister,
  adminLogin,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getProfile,
  getRideStats,
  getAllDrivers,
  getDriverByUserId,
  approveDriver,
  rejectDriver,
  getDriverStats,
  getNewUsersLastWeek,
  getDriverHoldList,
  getAllRidesliste,

};