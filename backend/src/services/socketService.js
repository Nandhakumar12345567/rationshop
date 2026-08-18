let ioInstance = null;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    ioInstance = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    ioInstance.on('connection', (socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`);

      socket.on('join_shop', (shopId = 'shop_1') => {
        const room = `shop_${shopId}`;
        socket.join(room);
        console.log(`[Socket.io] Socket ${socket.id} joined room: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      });
    });

    return ioInstance;
  },

  getIO: () => {
    return ioInstance;
  },

  emitQueueUpdate: (shopId = 'shop_1', queueData) => {
    if (ioInstance) {
      const room = `shop_${shopId}`;
      ioInstance.to(room).emit('queue:update', queueData);
      ioInstance.emit('queue:update', queueData);
      console.log(`[Socket.io] Emitted queue:update to room ${room}`);
    }
  },

  emitSlotUpdate: (slotData) => {
    if (ioInstance) {
      ioInstance.emit('slot:update', slotData);
      console.log(`[Socket.io] Emitted slot:update`);
    }
  },

  emitStockUpdate: (shopId = 'FPS-TN-0401', stockData) => {
    if (ioInstance) {
      ioInstance.emit('stock:update', { shop_id: shopId, stock: stockData });
      console.log(`[Socket.io] Emitted stock:update for ${shopId}`);
    }
  },

  emitIssueComplete: (issueData) => {
    if (ioInstance) {
      ioInstance.emit('issue:complete', issueData);
      console.log(`[Socket.io] Emitted issue:complete for booking ${issueData?.booking_id}`);
    }
  },

  emitAnalyticsUpdate: (analyticsData) => {
    if (ioInstance) {
      ioInstance.emit('analytics:update', analyticsData);
      console.log(`[Socket.io] Emitted analytics:update`);
    }
  }
};
