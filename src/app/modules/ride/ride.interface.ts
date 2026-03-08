import { Types } from "mongoose";

export interface ILocation {
  lat: number;
  lng: number;
  address: string;
}

// RideStatus type
export type RideStatus =
  | "pending"
  | "accepted"
  | "ongoing"   // আগে "started" → এখন "ongoing"
  | "completed"
  | "cancel";

export interface IRide {
  userId: Types.ObjectId;
  driverId?: Types.ObjectId;
  pickupLocation: ILocation;
  dropLocation: ILocation;
  distance: number;
  duration: number;
  fare: number;
  status: RideStatus;
  createdAt?: Date;
  updatedAt?: Date;
  startedAt?: Date;      // এখানে add করা হলো
  completedAt?: Date; 
    // ✅ Add these fields
  driverRating: Number,
  driverReview: String,

  // createdAt: { type: Date, default: Date.now },
  // updatedAt: { type: Date, default: Date.now },   // এখানে add করা হলো
}