import { Schema, model } from 'mongoose';

const rideSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'userType', 
      unique: true,
    },

    driverId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'userType', 
    },
    pickup: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled'],
      default: 'pending',
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

export const RideModel = model('Rides', rideSchema);
