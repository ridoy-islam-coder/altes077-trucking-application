// import { Notification } from './notification.model';
// import { User } from './user.model';


import User from "../user/user.model";
import { Notification } from "./notification.model";


 

interface SaveNotificationProps {
  userId: string;
  title: string;
  message: string;
  type?: 'welcome' | 'profile' | 'payment' | 'admin' | 'custom';
}

export const saveNotification = async ({
  userId,
  title,
  message,
  type = 'custom',
}: SaveNotificationProps) => {
  try {
    // ১. MongoDB ObjectId যাচাই
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId:', userId);
      return;
    }

    // ২. নোটিফিকেশন ডাটাবেসে সেভ করা
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      isRead: false,
      timestamp: new Date(),
    });

    // ৩. রিয়েল-টাইম নোটিফিকেশন
    const user = await User.findById(userId);
    if (user?.socketId) {
      io.to(user.socketId).emit('notification', {
        _id: notification._id,
        title,
        message,
        type,
        isRead: false,
      });
      console.log(`📤 Notification sent to ${userId}`);
    }

    return notification;
  } catch (error) {
    console.error('❌ Error in saveNotification:', error);
    throw error;
  }
};