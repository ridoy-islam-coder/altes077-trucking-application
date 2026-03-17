import { DriverModel } from "../drivermodel/dirver.model";
import { RideModel } from "./ride.model";
import { IRide } from './ride.interface';
import User from "../user/user.model";
import axios from "axios";
import mongoose, { Types } from "mongoose";
import { saveNotification } from "../notification/saveNotification";
import { io } from '../../../server'; // server.ts থেকে export করা io
import { Server } from 'socket.io';
import { DriverWalletModel } from "../driverWallet/driverWallet.model";
// import { io } from "../../server";

/* =========================
Create Ride
========================= */

export const getDistanceTime = async (
  origin: string,
  destination: string
) => {

  const apiKey ="AIzaSyCB3G-ob1C6JEUF_wotuQY1RMPKIbRkPIw";

  if (!apiKey) {
    throw new Error("Google Maps API key not found");
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;

  const response = await axios.get(url, {
    params: {
      origins: origin,
      destinations: destination,
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









interface CreateRidePayload {
  userId: string;
  driverId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number; // meters
  duration: number; // seconds
}

export const createRide = async (
  payload: CreateRidePayload
): Promise<IRide> => {

  const driver = await DriverModel.findById(payload.driverId);
  console.log("🚀 ~ file: ride.service.ts:34 ~ createRide ~ driver:", driver);

  if (!driver) {
    throw new Error("Driver not found");
  }

  const hours = payload.duration / 3600;

  const fare = hours * driver.hourRate;
      // 🚨 Add this check right after calculating fare
    if (isNaN(fare)) {
        console.error({ distance: payload.distance, rate: driver.hourRate, driver, pickupLocation: payload.pickupLocation, vehicleType: driver.vehicleType , driveruserID: driver.userId });
        throw new Error('Fare calculation failed: distance or rate is invalid');
    }


  const ride = await RideModel.create({
    ...payload,
    fare,
    status: "pending",
  });

  return ride;
};
















//driver service export


export const acceptRide = async (
  rideId: string,
  driverId: string,
  io: Server  // 🔹 add io parameter
) => {

  const ride = await RideModel.findById(rideId);
  

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "pending") {
    throw new Error("Ride already processed");
  }

   ride.driveruserID = new Types.ObjectId(driverId);
   ride.status = "accepted";

  await ride.save();




   // Notification to user
await saveNotification({
    io,
    userId: ride.userId.toString(),
    role: 'USER', // ✅ এখানে role ব্যবহার করতে হবে
    title: 'Ride Accepted',
    message: 'Your ride has been accepted by the driver',
    type: 'custom',
});

  return ride;
};




  // // ✅ Notify user
  // const user = await User.findById(ride.userId);
  // if (user?.socketId) {
  //   // ১. Live notification via Socket.IO
  //   io.to(user.socketId).emit('ride-accepted', {
  //     rideId: ride._id,
  //     driverId,
  //     message: 'Your ride has been accepted by the driver',
  //   });
  // }

  
export const rejectRide = async (
  rideId: string,
  driverId: string
) => {

  const ride = await RideModel.findById(rideId);

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "pending") {
    throw new Error("Ride already processed");
  }

  // ✅ optional (recommended)
  // rejected drivers list
  if (!ride.rejectedDrivers) {
    ride.rejectedDrivers = [];
  }

  ride.rejectedDrivers.push(
    new Types.ObjectId(driverId)
  );

  await ride.save();

  // ✅ notify user (optional)
  // io.to(ride.userId.toString()).emit("driver-rejected", {
  //   rideId: ride._id,
  //   driverId,
  // });
await saveNotification({
    io,
    userId: ride.userId.toString(),
    role: 'USER', 
    title: 'Ride Rejected',           // ❌ পরিবর্তন
    message: 'Your ride has been rejected by the driver', // ❌ পরিবর্তন
    type: 'custom',
});


  return ride;
};













export const getPendingRidesForDriver = async (
  vehicleType: string,
  lat?: number,
  lng?: number,
  radius?: number
) => {
  const query: any = {
    status: "pending",       // Pending রাইড
    vehicleType,             // Vehicle type অনুযায়ী filter
  };

  // Geo filter, যদি lat/lng/radius দেওয়া থাকে
  if (lat && lng && radius) {
    query.pickupLocation = {
      $geoWithin: { $centerSphere: [[lng, lat], radius / 6371] },
    };
    console.log("🚀 [DEBUG] geo query:", query.pickupLocation);
  }

  const rides = await RideModel.find(query)
    .populate("driveruserID", "userId vehicleType vehicleNumber")
    .populate("userId", "name email");

  console.log("🚀 [DEBUG] rides found:", rides.length);

  return rides;
};













export const getDriverDashboardService = async (driverId: string) => {
  const driverObjectId = new mongoose.Types.ObjectId(driverId);

  // ✅ total completed jobs
  const totalJobs = await RideModel.countDocuments({
    driverId: driverObjectId,
    status: "completed",
  });

  // ✅ wallet info
  const wallet = await DriverWalletModel.findOne({
    driverId: driverObjectId,
  });

  // ✅ total reviews
  const totalReviews = await RideModel.countDocuments({
    driverId: driverObjectId,
  });

  return {
    totalJobs,
    totalEarnings: wallet?.totalEarning || 0,
    totalReviews,
  };
};

 export const rideServices = {
  getPendingRidesForDriver,
 createRide,
 acceptRide,
 rejectRide,
 getDistanceTime,
 getDriverDashboardService
};
