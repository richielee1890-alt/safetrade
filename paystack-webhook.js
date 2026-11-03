const {admin, fs, J, PATH} = require('./_lib');
const crypto = require('crypto');
exports.handler = async ev => {
  if (ev.httpMethod !== 'POST') return {statusCode: 405};
  const raw = ev.isBase64Encoded ? Buffer.from(ev.body, 'base64').toString() : ev.body, sig = ev.headers['x-paystack-signature'] || '';
  const h = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET).update(raw).digest('hex');
  if (h.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig))) return {statusCode: 401};
  const e = JSON.parse(raw), D = e.data || {};
  const ts = admin.firestore.FieldValue.serverTimestamp();
  if (e.event === 'charge.success') {
    const m = D.metadata || {};
    if (!PATH.test(m.path || '')) return {statusCode: 200};
    const ref = fs.doc(m.path);
    await fs.runTransaction(async t => {
      const s = await t.get(ref); if (!s.exists) return;
      const d = s.data();
      if (d.status !== 'AWAITING_PAYMENT' || D.currency !== 'NGN' || D.amount < d.amount * 100) return;   // wrong amount => ignored
      t.update(ref, {status: 'HOLDING', payRef: D.reference, buyerName: String(m.buyerName || '').slice(0, 60), tokenHash: String(m.tokenHash || '').slice(0, 64), paidAt: ts});
      t.set(fs.doc('contacts/' + ref.id), {email: D.customer && D.customer.email || '', phone: String(m.buyerPhone || '').slice(0, 15), createdAt: ts});
    });
  } else if (e.event === 'transfer.success' || e.event === 'transfer.failed' || e.event === 'transfer.reversed') {
    const t = await fs.doc('transfers/' + D.reference).get();
    if (t.exists) await fs.doc(t.data().path).update(e.event === 'transfer.success' ? {status: 'RELEASED', releasedAt: ts} : {status: 'PAYOUT_FAILED', payoutError: e.event});
  }
  return {statusCode: 200};
};
