exports.handler = async () => {
  try {
    const res = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
