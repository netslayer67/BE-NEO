"use strict";
// src/server.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const socket_service_1 = require("./services/socket.service");
const PORT = process.env.PORT || 5000;
// 1. Buat HTTP server dari express app
const httpServer = http_1.default.createServer(app_1.default);
// 2. Inisialisasi Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'https://radiantrage.vercel.app'],
        methods: ["GET", "POST"],
        credentials: true,
    },
});
// 3. Simpan instance Socket.IO agar bisa digunakan modul lain
(0, socket_service_1.initializeSocketIO)(io);
// 4. Log saat koneksi masuk
io.on('connection', (socket) => {
    console.log('[Socket.IO] Connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('[Socket.IO] Disconnected:', socket.id);
    });
});
// 5. Jalankan server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[SERVER] Connecting to database...');
        yield (0, database_1.default)();
        console.log('[SERVER] Database connected.');
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Server failed to start:', error);
        process.exit(1);
    }
});
startServer();
