import {  Types, Document } from "mongoose";
/* =========================
   Image Interface
========================= */
export interface IImage {
  id: string;
  url: string;
}

/* =========================
   GeoJSON Location Interface
========================= */
export interface ILocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

/* =========================
   Driver Interface
========================= */
export interface IDriver extends Document {
  userId: Types.ObjectId;
   images: IImage[]; // 🔹 multiple images

  status: "active" | "inactive";

  vehicleType: string;
  vehicleCapacity: string;
  vehicleColor: Number;
  hourRate: number;
  location: ILocation;
  timestamp: Date;
  stripe_account_id?: string; // 🔹 Stripe account ID
}