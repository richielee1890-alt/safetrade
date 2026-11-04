exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };
  try {
    const { sellerPhone, dealId, amount, bankCode, accountNumber, sellerName } = JSON.parse(event.body);
    
    const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_KEY) throw new Error("Paystack key missing");

    // 1. Create recipient
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "nuban",
        name: sellerName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN"
      })
    });
    const recipientData = await recipientRes.json();
    if (!recipientData.status) throw new Error(recipientData.message || "Could not create recipient");
    
    const recipientCode = recipientData.data.recipient_code;

    // 2. Initiate transfer (amount in kobo, minus 3% fee)
    const fee = Math.round(amount * 0.03);
    const payoutAmount = (amount - fee) * 100;

    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: "balance",
        amount: payoutAmount,
        recipient: recipientCode,
        reason: `SafeTrade payout for ${dealId}`
      })
    });
    
    const transferData = await transferRes.json();
    if (!transferData.status) throw new Error(transferData.message);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        ok: true, 
        transfer: transferData.data,
        payout: payoutAmount / 100
      })
    };

  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, error: e.message })
    };
  }
};
