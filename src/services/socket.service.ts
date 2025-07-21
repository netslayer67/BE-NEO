import { Server } from 'socket.io';

let io: Server;

export const initializeSocketIO = (serverIo: Server) => {
    io = serverIo;
    io.on('connection', (socket) => {
        console.log('Klien terhubung:', socket.id);
        socket.on('disconnect', () => {
            console.log('Klien terputus:', socket.id);
        });
    });
};

export const getSocketIO = () => {
    if (!io) {
        throw new Error('Socket.IO belum diinisialisasi!');
    }
    return io;
};