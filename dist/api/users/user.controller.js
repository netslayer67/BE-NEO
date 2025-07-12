"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyProfileHandler = exports.getMyProfileHandler = void 0;
const user_service_1 = require("./user.service");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../errors/apiError");
/**
 * Handler untuk mendapatkan profil pengguna yang sedang login.
 */
const getMyProfileHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            throw new apiError_1.ApiError(401, 'User not authenticated or user ID is missing.');
        }
        // --- PERBAIKAN DI SINI ---
        // Konversi _id (yang merupakan ObjectId) menjadi string sebelum dikirim ke service.
        const userProfile = yield (0, user_service_1.getUserProfile)(req.user._id.toString());
        return new apiResponse_1.ApiResponse(res, 200, 'Profile fetched successfully', userProfile);
    }
    catch (error) {
        next(error);
    }
});
exports.getMyProfileHandler = getMyProfileHandler;
/**
 * Handler untuk memperbarui profil pengguna yang sedang login.
 */
const updateMyProfileHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            throw new apiError_1.ApiError(401, 'User not authenticated or user ID is missing.');
        }
        // --- PERBAIKAN DI SINI ---
        // Konversi _id (yang merupakan ObjectId) menjadi string.
        const updatedUser = yield (0, user_service_1.updateUserProfile)(req.user._id.toString(), req.body);
        return new apiResponse_1.ApiResponse(res, 200, 'Profile updated successfully', updatedUser);
    }
    catch (error) {
        next(error);
    }
});
exports.updateMyProfileHandler = updateMyProfileHandler;
