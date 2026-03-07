import { Schema, model, Types, Document } from "mongoose";
import { IDriver, IImage } from "./driver.interface";






const imageSchema = new Schema<IImage>({
  id: { type: String, required: true },
  url: { type: String, required: true },
});

/* =========================
   Driver Schema
========================= */
const driverSchema = new Schema<IDriver>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userType",
      unique: true,
    },

    // 🔹 Change from single image to array of images
    images: {
       type: [imageSchema],
       validate: [arrayLimit, "{PATH} exceeds the limit of 4"],
       default: [],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },

    vehicleType: {
      type: String,
      required: true,
   
    },

    // vehicleNumber: {
    //   type: String,
    //   required: true,
    // },

    vehicleCapacity: {
      type: String,
      required: true,
    },

    vehicleColor: {
      type: String,
      required: true,
    },

    hourRate: {
      type: Number,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* =========================
   GEO INDEX
========================= */
driverSchema.index({ location: "2dsphere" });

/* =========================
   Array Validation Function
========================= */
function arrayLimit(val: IImage[]) {
  return val.length <= 4; // max 4 images
}

/* =========================
   Export Model
========================= */
export const DriverModel = model<IDriver>("Driver", driverSchema);