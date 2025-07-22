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
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors")); // Import CorsOptions
const helmet_1 = __importDefault(require("helmet"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socket_service_1 = require("./services/socket.service");
const database_1 = __importDefault(require("./config/database"));
const api_1 = __importDefault(require("./api"));
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Create HTTP server
const httpServer = http_1.default.createServer(app);
// --- KONFIGURASI CORS TERPUSAT ---
// Daftar domain yang diizinkan untuk mengakses backend Anda
const allowedOrigins = [
    'http://localhost:5173', // Frontend saat development lokal
    'https://radiantrage.vercel.app' // Frontend Anda di Vercel
];
const corsOptions = {
    origin: (origin, callback) => {
        // Izinkan jika origin ada di dalam daftar, atau jika tidak ada origin (misalnya dari Postman, server-side requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('This origin is not allowed by CORS policy.'));
        }
    },
    credentials: true, // Penting jika Anda menggunakan cookies atau header otentikasi
    optionsSuccessStatus: 200 // For legacy browser support
};
// --- Inisialisasi Socket.IO dengan Opsi CORS ---
exports.io = new socket_io_1.Server(httpServer, {
    cors: corsOptions
});
(0, socket_service_1.initializeSocketIO)(exports.io);
// Socket.IO: Connection Event
exports.io.on('connection', (socket) => {
    console.log('[Socket.IO] Connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('[Socket.IO] Disconnected:', socket.id);
    });
});
app.use((0, cors_1.default)(corsOptions));
// Secara eksplisit menangani pre-flight requests di semua rute
app.options('*', (0, cors_1.default)(corsOptions));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api/v1', api_1.default);
// Error Handling
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
/**
 * Main server start function
 */
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[SERVER] Connecting to database...');
        yield (0, database_1.default)();
        console.log('[SERVER] Database connected successfully.');
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
