// Bank name to Paystack code map
const BANK_CODES = {
  "OPay": "999992",
  "Palmpay": "100033",
  "PalmPay": "100033",
  "Kuda": "50211",
  "Moniepoint": "50515",
  "MoniePoint": "50515",
  "Access Bank": "044",
  "GTB": "058",
  "GTBank": "058",
  "GT Bank": "058",
  "First Bank": "011",
  "FirstBank": "011",
  "UBA": "033",
  "Zenith": "057",
  "Zenith Bank": "057",
  "Opay": "999992",
  "opay": "999992"
};

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    let body = {};
    try { 
      body = JSON.parse(event.body || "{}"); 
    } catch { 
      body = {}; 
    }
    
    // Accept any format from frontend
    let account_number = body.account_number || body.accountNumber || body.account || params.account_number || params.accountNumber;
    let bank_code = body.bank_code || body.bankCode || body.bank || params.bank_code || params.bankCode || params.bank;

    // Convert bank name to code
    if (bank_code && BANK_CODES[bank_code]) {
      bank_code = BANK_CODES[bank_code];
    }
    if (bank_code === "OPay" || bank_code === "OPAY" || bank_code === "opay") {
      bank_code = "999992";
    }

    if (!account_number || !bank_code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `account_number and bank_code required - got account:${account_number} bank:${bank_code}`,
          received_body: body,
          received_query: params
        })
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
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
