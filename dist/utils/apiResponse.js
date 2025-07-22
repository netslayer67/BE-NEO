"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(res, statusCode, message, data) {
        res.status(statusCode).json({
            success: statusCode < 400,
            message,
            data,
        });
    }
}
exports.ApiResponse = ApiResponse;
