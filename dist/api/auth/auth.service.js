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
exports.loginUser = exports.registerUser = void 0;
const user_model_1 = require("@/models/user.model");
const jwt_1 = require("@/utils/jwt");
const apiError_1 = require("@/errors/apiError");
const registerUser = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const userExists = yield user_model_1.User.findOne({ email: input.email });
    if (userExists) {
        throw new apiError_1.ApiError(409, 'User with this email already exists.');
    }
    const user = yield user_model_1.User.create(input);
    const token = (0, jwt_1.generateToken)({ id: user._id, role: user.role });
    // Hindari mengirim password kembali
    user.password = undefined;
    return { user, token };
});
exports.registerUser = registerUser;
const loginUser = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email: input.email }).select('+password');
    if (!user || !(yield user.comparePassword(input.password))) {
        throw new apiError_1.ApiError(401, 'Invalid email or password.');
    }
    const token = (0, jwt_1.generateToken)({ id: user._id, role: user.role });
    user.password = undefined;
    return { user, token };
});
exports.loginUser = loginUser;
