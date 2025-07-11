"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    // Pastikan secret key ada sebelum digunakan.
    if (!secret) {
        throw new Error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
    }
    // --- PERBAIKAN FINAL DI SINI ---
    // Gunakan angka (detik) untuk expiresIn untuk menghindari masalah tipe string.
    // 7 * 24 * 60 * 60 = 604800 detik (7 hari)
    const signOptions = {
        expiresIn: 604800,
    };
    // Panggil jwt.sign dengan variabel yang tipenya sudah pasti.
    return jsonwebtoken_1.default.sign(payload, secret, signOptions);
};
exports.generateToken = generateToken;
