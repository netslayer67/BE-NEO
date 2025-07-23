"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIO = exports.initializeSocketIO = void 0;
let io = null;
const initializeSocketIO = (server) => {
    io = server;
};
exports.initializeSocketIO = initializeSocketIO;
const getSocketIO = () => {
    if (!io)
        throw new Error('Socket.IO belum diinisialisasi!');
    return io;
};
exports.getSocketIO = getSocketIO;
