exports.handler = async function(event, context) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return { statusCode: 500, body: JSON.stringify({ error: "PAYSTACK_SECRET_KEY not set" }) };
    }
    const response = await fetch("https://api.paystack.co/bank?country=nigeria", {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
