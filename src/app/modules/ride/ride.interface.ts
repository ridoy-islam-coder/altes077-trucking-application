import {  Types, Document } from "mongoose";

/* =========================
   Ride Status Type
========================= */
export type RideStatus =
  | "pending"
  | "accepted"
  | "ongoing"
  | "completed"
  | "cancelled";

/* =========================
   Ride Interface
========================= */
export interface IRide extends Document {
  userId: Types.ObjectId;
  driverId?: Types.ObjectId;

  pickup?: string;
  destination?: string;

  fare?: number;

  status: RideStatus;

  duration?: number; // seconds
  distance?: number; // meters

  paymentId?: string;
  orderId?: string;
  signature?: string;

  rating?: number;

  date?: string;

  timestamp: Date;
}
