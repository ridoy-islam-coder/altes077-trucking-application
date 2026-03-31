import { Server } from 'socket.io';
import mongoose from 'mongoose';
import User from '../user/user.model';

interface SaveNotificationProps {
    io: Server;
    userId: string;
}

export const getuserdata  = async ({
  io,
  userId,
 
}: SaveNotificationProps) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId:', userId);
      return;
    }

    const user = await User.findById(userId);

    return user;
  } catch (error) {
    console.error('❌ Error in getuserdata:', error);
    throw error;
  }
};





