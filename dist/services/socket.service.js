"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIO = exports.initializeSocketIO = void 0;
let io;
const initializeSocketIO = (serverIo) => {
    io = serverIo;
    io.on('connection', (socket) => {
        console.log('Klien terhubung:', socket.id);
        socket.on('disconnect', () => {
            console.log('Klien terputus:', socket.id);
        });
    });
};
exports.initializeSocketIO = initializeSocketIO;
const getSocketIO = () => {
    if (!io) {
        throw new Error('Socket.IO belum diinisialisasi!');
    }
    return io;
};
exports.getSocketIO = getSocketIO;
