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
exports.loginHandler = exports.registerHandler = void 0;
const auth_service_1 = require("./auth.service");
const apiResponse_1 = require("../../utils/apiResponse");
const registerHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user, token } = yield (0, auth_service_1.registerUser)(req.body);
        return new apiResponse_1.ApiResponse(res, 201, 'User registered successfully', { user, token });
    }
    catch (error) {
        next(error);
    }
});
exports.registerHandler = registerHandler;
const loginHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user, token } = yield (0, auth_service_1.loginUser)(req.body);
        return new apiResponse_1.ApiResponse(res, 200, 'Login successful', { user, token });
    }
    catch (error) {
        next(error);
    }
});
exports.loginHandler = loginHandler;
