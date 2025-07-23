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
exports.generateSnapToken = void 0;
const midtrans_service_1 = require("../../services/midtrans.service");
const generateSnapToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, amount, customer } = req.body;
        if (!orderId || !amount || !customer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const midtransResponse = yield (0, midtrans_service_1.createTransaction)(orderId, amount, customer);
        return res.json({ snapToken: midtransResponse.token });
    }
    catch (error) {
        console.error('Midtrans error:', error);
        return res.status(500).json({ error: 'Failed to generate Midtrans token' });
    }
});
exports.generateSnapToken = generateSnapToken;
