"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapMidtransToInternalStatus = mapMidtransToInternalStatus;
const midtransToOrderStatusMap = {
    capture: "Diproses",
    settlement: "Diproses",
    pending: "Pending Payment",
    cancel: "Cancelled",
    expire: "Cancelled",
    deny: "Cancelled",
    // Challenge dianggap tetap pending
    challenge: "Pending Payment"
};
function mapMidtransToInternalStatus(transactionStatus, fraudStatus) {
    if (transactionStatus === "capture") {
        if (fraudStatus === "challenge")
            return "Pending Payment";
        if (fraudStatus === "accept")
            return "Diproses";
        return "Pending Payment";
    }
    return midtransToOrderStatusMap[transactionStatus] || null;
}
