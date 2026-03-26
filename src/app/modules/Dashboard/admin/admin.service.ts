

import httpStatus from 'http-status';
import { Admin } from './admin.model';
import AppError from '../../../error/AppError';
import { RideModel } from '../../ride/ride.model';
import User from '../../user/user.model';
import { DriverModel } from '../../drivermodel/dirver.model';
import { Types } from 'mongoose';

const updateAdminProfile = async (id: string, payload: Record<string, any>) => {
  const allowedFields = ['fullName', 'phoneNumber', 'image'];
  const updateData: Record<string, any> = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  });
  const admin = await Admin.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!admin) throw new AppError(httpStatus.NOT_FOUND, 'Admin not found');

  return admin;
};

const changePassword = async (
  id: string,
  oldPassword: string,
  newPassword: string,
) => {
  const admin = await Admin.findById(id).select('+password');
  if (!admin) throw new AppError(404, 'Admin not found');

  const isMatch = await admin.isPasswordMatched(oldPassword);
  if (!isMatch) throw new AppError(401, 'Old password incorrect');

  admin.password = newPassword;
  await admin.save();
};

const setForgotOtp = async (email: string) => {
  const admin = await Admin.findOne({ email });
  if (!admin) throw new AppError(404, 'Admin not found');

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  admin.verification = { otp, expiresAt, verified: false };
  await admin.save();

  return otp;
};

const verifyOtp = async (email: string, otp: number) => {
  const admin = await Admin.findOne({ email });
  if (!admin || !admin.verification)
    throw new AppError(404, 'OTP not generated');

  if (admin.verification.verified)
    throw new AppError(400, 'OTP already verified');

  if (Date.now() > new Date(admin.verification.expiresAt).getTime()) {
    throw new AppError(400, 'OTP expired');
  }

  if (admin.verification.otp !== otp) throw new AppError(400, 'Invalid OTP');

  admin.verification.verified = true;
  await admin.save();
};

const resetPassword = async (email: string, newPassword: string) => {
  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin || !admin.verification?.verified) {
    throw new AppError(400, 'OTP not verified');
  }

  admin.password = newPassword;
  admin.verification = undefined;
  await admin.save();
};












const getRideStats = async () => {
  const stats = await RideModel.aggregate([
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },

        acceptedJobs: {
          $sum: {
            $cond: [{ $eq: ["$status", "accepted"] }, 1, 0],
          },
        },

        cancelJobs: {
          $sum: {
            $cond: [{ $eq: ["$status", "cancel"] }, 1, 0],
          },
        },
      },
    },
  ]);

  return stats[0] || {
    totalJobs: 0,
    acceptedJobs: 0,
    cancelJobs: 0,
  };
};









const getAllDrivers = async () => {
  
  const drivers = await User.find({ role: 'DRIVER', isDeleted: false })
    .select('-password') 
    .sort({ createdAt: -1 }); // latest first

  return drivers;
};



const getDriverByUserId = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid userId');
  }

  const driver = await DriverModel.findOne({ userId: new Types.ObjectId(userId) });

  if (!driver) return null;

  return driver;
};
const approveDriver = async (userId: string) => {
  // ObjectId validation optional (comment out / remove)
  // if (!Types.ObjectId.isValid(userId)) {
  //   throw new Error("Invalid user id format");
  // }

  // Convert string to ObjectId
  const driver = await DriverModel.findOne({
    userId: new Types.ObjectId(userId),
  });

  if (!driver) {
    throw new Error("Driver not found with this user");
  }

  driver.isApproved = true;
  driver.status = "active";

  await driver.save();

  return driver;
};


const rejectDriver = async (userId: string) => {
  const driver = await DriverModel.findOne({
    userId: new Types.ObjectId(userId),
  });

  if (!driver) {
    throw new Error("Driver not found with this user");
  }


  driver.isApproved = false;
  driver.status = 'inactive'; // optional: deactivate rejected driver
  await driver.save();
  return driver;
};





const getDriverStats = async () => {
  const totalDrivers = await DriverModel.countDocuments({});
  const approvedDrivers = await DriverModel.countDocuments({ isApproved: true });
  const rejectedDrivers = await DriverModel.countDocuments({ isApproved: false });

  return {
    totalDrivers,
    approvedDrivers,
    rejectedDrivers,
  };
};





const getNewUsersLastWeek = async (
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  // last 7 days date
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const query = {
    createdAt: { $gte: sevenDaysAgo },
  };

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: users,
  };
};





const getDriverHoldList = async (
  page: number,
  limit: number,
  searchTerm?: string,
) => {
  const skip = (page - 1) * limit;

  const matchStage: any = {
    isApproved: false, // HOLD drivers
  };

  const searchMatch = searchTerm
    ? {
        $or: [
          { "user.fullName": { $regex: searchTerm, $options: "i" } },
          { "user.email": { $regex: searchTerm, $options: "i" } },
          { "user.phoneNumber": { $regex: searchTerm, $options: "i" } },
        ],
      }
    : {};

  const aggregation = [
    { $match: matchStage },

    // 🔥 join User collection
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },

    { $unwind: "$user" },

    // 🔎 search filter
    ...(searchTerm ? [{ $match: searchMatch }] : []),

    { $sort: { createdAt: -1 } },

    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    },
  ];

  const result = await DriverModel.aggregate(aggregation as any);

  const total = result[0].total[0]?.count || 0;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result[0].data,
  };
};



//ride liste 

const getAllRides = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const rides = await RideModel.find()
    // 👤 Ride creator user
    .populate({
      path: 'userId',
      select: '-password',
    })

    // 🚚 Driver profile
    .populate({
      path: 'driverId',
      populate: {
        path: 'userId', // driver → user
        select: '-password',
      },
    })

    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await RideModel.countDocuments();

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: rides,
  };
};

export const adminService = {
  updateAdminProfile,
  changePassword,
  setForgotOtp,
  verifyOtp,
  resetPassword,
  getRideStats,
  getAllDrivers,
  getDriverByUserId,
  approveDriver,
  rejectDriver,
  getDriverStats,
  getNewUsersLastWeek,
  getDriverHoldList,
  getAllRides,
};
