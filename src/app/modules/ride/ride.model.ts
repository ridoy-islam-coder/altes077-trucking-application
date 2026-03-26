

// import mongoose, { Schema, model } from "mongoose";
// import { IRide } from "./ride.interface";


// const locationSchema = new Schema(
//   {
//     lat: {
//       type: Number,
//       required: true,
//     },

//     lng: {
//       type: Number,
//       required: true,
//     },

//     address: {
//       type: String,
//       required: true,
//     },
//   },
//   { _id: false }
// );

// const rideSchema = new Schema<IRide>(
//   {
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     driverId: {
//       type: Schema.Types.ObjectId,
//       ref: "Driver",
//     },

//     pickupLocation: {
//       type: locationSchema,
//       required: true,
//     },

//     dropLocation: {
//       type: locationSchema,
//       required: true,
//     },

//     distance: {
//       type: Number,
//       required: true,
//     },

//     duration: {
//       type: Number,
//       required: true,
//     },
//       distanceText: {type: String, },
//       durationText: {type: String, }, 
//     fare: {
//       type: Number,
//       required: true,
//     },
//     pickupTime: {
//       type: String,
//     },
//     pickupDate: {
//       type: String,
//     }, 
//     status: {
//       type: String,
//       enum: [
//         "pending",
//         "accepted",
//         "rejected",
//         "completed",
//         "cancel",
//       ],
//       default: "pending",
//     },
//     // ✅ Add these fields
//     driverRating: {
//       type: Number,
//       min: 1,
//       max: 5,
//     },
//     userNotes: {
//       type: String,
//       maxlength: 200,
//     },
//       driverReview: {
//       type: String,
//       maxlength: 500,
//     },
//  driveruserID: { type: Schema.Types.ObjectId, ref: "User" },
// vehicleType: { type: String },

//     // ✅ FIXED POSITION
//     // ✅ rejectedDrivers ঠিকভাবে এখানে
//     rejectedDrivers: [
//       { type: Schema.Types.ObjectId, ref: "Driver" }
//     ],
    
//       },
//   {
//     timestamps: true,
//   }
// );

// export const RideModel = model<IRide>("Ride", rideSchema);



import mongoose, { Schema, model } from "mongoose";
import { IRide } from "./ride.interface";

const locationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const rideSchema = new Schema<IRide>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver" },
    driveruserID: { type: Schema.Types.ObjectId, ref: "Driver" },
    vehicleType: { type: String },
    pickupLocation: { type: locationSchema, required: true },
    dropLocation: { type: locationSchema, required: true },
    distance: { type: Number, required: true },
    duration: { type: Number, required: true },
    fare: { type: Number, required: true },
    scheduleDate: { type: Date, default: null },
    scheduleTime: { type: String, default: null },
    workNotes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "started", "completed", "cancel"],
      default: "pending",
    },
    rejectedDrivers: [{ type: Schema.Types.ObjectId, ref: "Driver" }],
  },
  { timestamps: true }
);

// Create 2dsphere index for geo queries
rideSchema.index({ "pickupLocation": "2dsphere" });

export const RideModel = model<IRide>("Ride", rideSchema);