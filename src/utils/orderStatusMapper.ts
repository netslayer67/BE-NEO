export type InternalOrderStatus =
  | "Pending Payment"
  | "Diproses"
  | "Dikirim"
  | "Telah Sampai"
  | "Cancelled";

const midtransToOrderStatusMap: Record<string, InternalOrderStatus> = {
  capture: "Diproses",
  settlement: "Diproses",
  pending: "Pending Payment",
  cancel: "Cancelled",
  expire: "Cancelled",
  deny: "Cancelled",
  // Challenge dianggap tetap pending
  challenge: "Pending Payment"
};

export function mapMidtransToInternalStatus(
  transactionStatus: string,
  fraudStatus?: string
): InternalOrderStatus | null {
  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") return "Pending Payment";
    if (fraudStatus === "accept") return "Diproses";
    return "Pending Payment";
  }

  return midtransToOrderStatusMap[transactionStatus] || null;
}
