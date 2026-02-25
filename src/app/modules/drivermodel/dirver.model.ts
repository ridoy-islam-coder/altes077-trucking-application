
import { Schema, model } from 'mongoose';





const imageSchema = new Schema({
  id: {
    type: String, // Allows string or number
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});


const driverSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'userType', 
      unique: true, // 🔹 একটি user একবারই driver create করতে পারবে
    },

    image: imageSchema,
    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive',
    },
    vehicleType: {
      type: String,
      required: true,   
      enum: ['Truck', 'Van', 'Trailer', 'Flatbed', 'Refrigerated', 'Tanker', 'Container', 'Other'], // Example vehicle types
    },
    vehicleNumber: {
     type: String,
     required: true,
    },
    vehicleCapacity: {
      type: String,
      required: true,
    },
    vehicleColor: {
      type: String,
      required: true,
    },
    
    // location: {
    //     lng: {
    //         type: Number,
          
    //     },
    //     ltd: {
    //         type: Number,
           
    //     },
    // },

    
   location: {
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], required: true } // [lng, lat]
},


    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const DriverModel = model('Driver', driverSchema);

driverSchema.index({ location: "2dsphere" })