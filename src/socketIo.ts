import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import User from './app/modules/user/user.model';

const initializeSocketIO = (server: HttpServer): IOServer => {
  const io = new IOServer(server, {
    cors: { origin: '*' },
  });

  io.on('connection', async (socket: Socket) => {
    try {
      const { userId, role } = socket.handshake.auth; // frontend থেকে role আসবে
      if (!userId || !role) {
        console.log('❌ Missing userId or role');
        return;
      }

      console.log('🔥 SOCKET CONNECTED:', socket.id);
      console.log('AUTH DATA =>', userId, role);

      // room join: USER-<id> বা DRIVER-<id>
      const roomName = `${role}-${userId}`.toLowerCase(); // lowercase convenience
      socket.join(roomName);
      console.log(`✅ Joined room: ${roomName}`);

      // socketId save করা
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { socketId: socket.id },
        { new: true }
      );
      console.log('✅ socketId saved =>', updatedUser?.socketId);

      // disconnect হলে socketId clear করা
      socket.on('disconnect', async () => {
        console.log('❌ DISCONNECTED:', socket.id);
        await User.findByIdAndUpdate(userId, { socketId: null });
      });

    } catch (error) {
      console.error('Socket Error:', error);
    }
  });

  return io;
};

export default initializeSocketIO;