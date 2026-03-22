import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {

    // Patient or staff joins a branch room to get live queue updates
    // Client sends: { branchId }
    socket.on('join:branch', (branchId) => {
      if (!branchId) return;
      socket.join(`branch:${branchId}`);
    });

    // Patient joins their personal room for targeted notifications
    // (your turn soon, your token called)
    // Client sends: { patientId }
    socket.on('join:patient', (patientId) => {
      if (!patientId) return;
      socket.join(`patient:${patientId}`);
    });

    socket.on('leave:branch', (branchId) => {
      if (!branchId) return;
      socket.leave(`branch:${branchId}`);
    });

    socket.on('leave:patient', (patientId) => {
      if (!patientId) return;
      socket.leave(`patient:${patientId}`);
    });

    socket.on('disconnect', () => {
      // Socket.io auto-removes from all rooms on disconnect
    });
  });

  console.log('[Socket.io] Initialized');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.');
  return io;
};