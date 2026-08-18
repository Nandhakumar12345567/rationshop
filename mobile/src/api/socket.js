import { io } from 'socket.io-client';
import { Platform } from 'react-native';

const getSocketUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionListeners = new Set();
  }

  connect(shopId = 'shop_1') {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const socketUrl = getSocketUrl();
    console.log(`[SocketManager] Connecting to ${socketUrl}...`);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log(`[SocketManager] Connected successfully with ID: ${this.socket.id}`);
      this.isConnected = true;
      this.socket.emit('join_shop', shopId);
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[SocketManager] Disconnected: ${reason}`);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[SocketManager] Connection Error:', error.message);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    });

    return this.socket;
  }

  onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    callback(this.isConnected);
    return () => this.connectionListeners.delete(callback);
  }

  notifyConnectionListeners(status) {
    this.connectionListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.error(e);
      }
    });
  }

  subscribeToQueue(callback) {
    if (!this.socket) this.connect();
    this.socket.on('queue:update', callback);
    return () => this.socket.off('queue:update', callback);
  }

  subscribeToSlots(callback) {
    if (!this.socket) this.connect();
    this.socket.on('slot:update', callback);
    return () => this.socket.off('slot:update', callback);
  }

  subscribeToStock(callback) {
    if (!this.socket) this.connect();
    this.socket.on('stock:update', callback);
    return () => this.socket.off('stock:update', callback);
  }

  subscribeToIssueComplete(callback) {
    if (!this.socket) this.connect();
    this.socket.on('issue:complete', callback);
    return () => this.socket.off('issue:complete', callback);
  }

  subscribeToAnalytics(callback) {
    if (!this.socket) this.connect();
    this.socket.on('analytics:update', callback);
    return () => this.socket.off('analytics:update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketManager = new SocketManager();
