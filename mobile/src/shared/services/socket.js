import { io } from 'socket.io-client';

class SocketService {
  socket = null;

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:5000');
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
