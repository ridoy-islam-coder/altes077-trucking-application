import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    role: { // frontend থেকে আসা role
      type: String,
      required: true,
      enum: ['USER', 'DRIVER'],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['welcome', 'profile', 'payment', 'admin', 'custom'],
      default: 'custom',
    },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = model('Notification', notificationSchema);