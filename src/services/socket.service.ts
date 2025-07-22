// src/services/socket.service.ts
import { Server } from 'socket.io';

let io: Server | null = null;

export const initializeSocketIO = (server: Server) => {
  io = server;
};

export const getSocketIO = (): Server => {
  if (!io) throw new Error('Socket.IO belum diinisialisasi!');
  return io;
};
