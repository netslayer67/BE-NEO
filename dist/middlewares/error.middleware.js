"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const apiError_1 = require("../errors/apiError");
const notFoundHandler = (req, res, next) => {
    const error = new apiError_1.ApiError(404, `Not Found - ${req.originalUrl}`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;
