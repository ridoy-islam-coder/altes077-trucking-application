// import { Schema, model,  } from "mongoose";
// import { IRide } from "./ride.interface";

// /* =========================
//    Ride Schema
// ========================= */
// const rideSchema = new Schema<IRide>(
//   {
//     userId: {
//       type: Schema.Types.ObjectId,
//       required: true,
//       refPath: "userType",
//       unique: true,
//     },

//     driverId: {
//       type: Schema.Types.ObjectId,
//       refPath: "userType",
//     },

//     pickup: {
//       type: String,
//     },

//     destination: {
//       type: String,
//     },

//     fare: {
//       type: Number,
//     },

//     status: {
//       type: String,
//       enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
//       default: "pending",
//     },

//     duration: {
//       type: Number,
//     }, // seconds

//     distance: {
//       type: Number,
//     }, // meters

//     paymentId: {
//       type: String,
//     },

//     orderId: {
//       type: String,
//     },

//     signature: {
//       type: String,
//     },

//     rating: {
//       type: Number,
//       min: 1,
//       max: 5,
//     },

//     date: {
//       type: String,
//     },

//     timestamp: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /* =========================
//    Model Export
// ========================= */
// export const RideModel = model<IRide>("Rides", rideSchema);


import { Schema, model } from "mongoose";
import { IRide } from "./ride.interface";

const locationSchema = new Schema(
  {
    lat: {
      type: Number,
      required: true,
    },

    lng: {
      type: Number,
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },

    pickupLocation: {
      type: locationSchema,
      required: true,
    },

    dropLocation: {
      type: locationSchema,
      required: true,
    },

    distance: {
      type: Number,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    fare: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "ongoing",
        "completed",
        "cancel",
      ],
      default: "pending",
    },
    // ✅ Add these fields
    driverRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    driverReview: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

export const RideModel = model<IRide>("Ride", rideSchema);