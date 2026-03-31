import { Server } from 'socket.io';
import mongoose from 'mongoose';
import User from '../user/user.model';
import { Notification } from './notification.model';

interface SaveNotificationProps {
  io: Server;
  userId: string;
  role: 'USER' | 'DRIVER';
  title: string;
  message: string;
  type?: 'welcome' | 'profile' | 'payment' | 'admin' | 'custom';
}

export const saveNotification = async ({
  io,
  userId,
  role,
  title,
  message,
  type = 'custom',
}: SaveNotificationProps) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId:', userId);
      return;
    }

    const notification = await Notification.create({
      userId,
      role,
      title,
      message,
      type,
      isRead: false,
      timestamp: new Date(),
    });

    const user = await User.findById(userId);

    if (user?.socketId) {
      io.to(user.socketId).emit('notification', {
        _id: notification._id,
        title,
        message,
        type,
        isRead: false,
        timestamp: notification.timestamp,
      });
      console.log(`📤 Notification sent to ${userId}`);
    }

    return notification;
  } catch (error) {
    console.error('❌ Error in saveNotification:', error);
    throw error;
  }
};





