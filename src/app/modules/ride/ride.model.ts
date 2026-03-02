import { Schema, model,  } from "mongoose";
import { IRide } from "./ride.interface";

/* =========================
   Ride Schema
========================= */
const rideSchema = new Schema<IRide>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userType",
      unique: true,
    },

    driverId: {
      type: Schema.Types.ObjectId,
      refPath: "userType",
    },

    pickup: {
      type: String,
    },

    destination: {
      type: String,
    },

    fare: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
      default: "pending",
    },

    duration: {
      type: Number,
    }, // seconds

    distance: {
      type: Number,
    }, // meters

    paymentId: {
      type: String,
    },

    orderId: {
      type: String,
    },

    signature: {
      type: String,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    date: {
      type: String,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   Model Export
========================= */
export const RideModel = model<IRide>("Rides", rideSchema);