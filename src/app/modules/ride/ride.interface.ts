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
  | "rejected"   // আগে "started" → এখন "ongoing"
  | "completed"
  | "cancel";

export interface IRide {
  _id: any;
  userId: Types.ObjectId;
  rejectedDrivers?: Types.ObjectId[]; // ✅ Add this field
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
  scheduleDate: Date | null; // ✅ Add this field
  scheduleTime: string | null; // ✅ Add this field
  workNotes: string; // ✅ Add this field
distanceText: string; // ✅ Add this field
durationText: string; // ✅ Add this field
driveruserID: Types.ObjectId; // ✅ Add this field
vehicleType: string; // ✅ Add this field
    // ✅ Add these fields
  driverRating: Number,
  driverReview: String,
  jobId: string; // ✅ Add unique jobId

}

