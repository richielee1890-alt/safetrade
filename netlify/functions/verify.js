const admin = require("firebase-admin");

function getServiceAccount() {
  let jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!jsonStr) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON missing");
  
  let serviceAccount = JSON.parse(jsonStr);
  // Fix \n in private_key
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }
  return serviceAccount;
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(getServiceAccount())
    });
  } catch (e) {
    console.log("Firebase init error:", e.message);
  }
}

exports.handler = async (event) => {
  try {
    const { account_number, bank_code } = JSON.parse(event.body);
    
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "PAYSTACK_SECRET_KEY missing" }) };
    }

    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    
    const data = await response.json();
    console.log("Paystack response:", JSON.stringify(data));
    
    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.log("VERIFY ERROR:", err.message);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: err.message, stack: err.stack })
    };
  }
};
