exports.handler = async (event) => {
  const { sellerPhone, item, amount, buyerName } = JSON.parse(event.body);
  // This just returns a WhatsApp link - no API needed
  const msg = `✅ SafeTrade Alert: Buyer PAID!\n\nItem: ${item}\nAmount: ₦${amount}\nBuyer: ${buyerName}\n\nMoney is in escrow. Please deliver now. Check My Deals.`;
  const link = `https://wa.me/234${sellerPhone.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`;
  return { statusCode: 200, body: JSON.stringify({ link }) };
};
