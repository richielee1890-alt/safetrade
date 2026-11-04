const BANK_CODES = {
  "OPay": "999992", "Opay": "999992", "opay": "999992",
  "PalmPay": "999991", "Palmpay": "999991", "PalmPay": "999991",
  "Kuda": "50211", "Moniepoint": "50515", "Access Bank": "044",
  "GTB": "058", "GTBank": "058", "First Bank": "011", "UBA": "033",
  "Zenith": "057"
};

exports.handler = async (event) => {
  try {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch {}
    const params = event.queryStringParameters || {};
    
    // Your frontend sends {account, bankCode}
    let account_number = body.account || body.account_number || body.accountNumber || params.account;
    let bank_code = body.bankCode || body.bank_code || body.bank || params.bankCode;

    if (bank_code && BANK_CODES[bank_code]) bank_code = BANK_CODES[bank_code];
    
    if (!account_number || !bank_code) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing account/bank", ok: false }) };
    }

    const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await res.json();

    // Format for your frontend
    if (data.status && data.data && data.data.account_name) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, accountName: data.data.account_name, raw: data }) };
    } else {
      // Return failure but don't block - frontend will show warning
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: data.message || "Could not verify", manual: true, raw: data }) };
    }
  } catch (err) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: err.message, manual: true }) };
  }
};
