exports.handler = async (event) => {
  try {
    // No Firebase needed for this function - only Paystack
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "PAYSTACK_SECRET_KEY missing in Netlify env vars" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const account_number = body.account_number || body.accountNumber;
    const bank_code = body.bank_code || body.bankCode;

    if (!account_number || !bank_code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "account_number and bank_code required" })
      };
    }

    const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();
    
    return {
      statusCode: res.status,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
