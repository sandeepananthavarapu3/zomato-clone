import { Server } from 'socket.io';

export const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Configure appropriately for production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Customer joins a room specific to their order
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Client ${socket.id} joined order_${orderId}`);
    });

    // Driver sends location update
    socket.on('driver_location_update', (data) => {
      const { orderId, lat, lng } = data;
      // Broadcast to the specific order room
      io.to(`order_${orderId}`).emit('driver_location_updated', { lat, lng });
    });

    // Order status change (can also be emitted from controllers using io object)
    socket.on('order_status_change', (data) => {
      const { orderId, status } = data;
      io.to(`order_${orderId}`).emit('status_changed', { status });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};
