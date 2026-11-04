exports.handler = async () => {
  try {
    const key = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;
    if (!key) return { statusCode: 500, body: JSON.stringify({error:"Paystack key not set"}) };
    const r = await fetch("https://api.paystack.co/bank", { headers: { Authorization: `Bearer ${key}` }});
    const j = await r.json();
    if (!j.status) return { statusCode: 500, body: JSON.stringify(j)};
    const data = j.data.filter(b => b.active).map(b => ({ name: b.name, code: b.code }));
    return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) };
  } catch(e){
    return { statusCode: 500, body: JSON.stringify({error:e.message}) };
  }
}
