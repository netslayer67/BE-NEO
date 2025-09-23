// src/utils/order.ts
export function calculateOrderTotal(
  itemsPrice: number,
  paymentMethod: 'online' | 'offline'
) {
  const shippingPrice = 15000;
  const adminFee = paymentMethod === 'offline' ? 2500 : 0;
  const discount = paymentMethod === 'online' ? 3000 : 0;

  const totalAmount = itemsPrice + shippingPrice + adminFee - discount;

  return { totalAmount, shippingPrice, adminFee, discount };
}
