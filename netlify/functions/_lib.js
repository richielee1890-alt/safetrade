const admin = require('firebase-admin');
const crypto = require('crypto');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))});
const fs = admin.firestore();
const ps = async (method, path, body) => {
  const r = await fetch('https://api.paystack.co' + path, {method, headers: {Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET, 'Content-Type': 'application/json'}, body: body ? JSON.stringify(body) : undefined});
  return r.json();
};
const J = (code, obj) => ({statusCode: code, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(obj)});
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const PATH = /^sellers\/0\d{10}\/deals\/[A-Za-z0-9]{20}$/;

// HOLDING -> PAYING_OUT, then pays the seller through Paystack Transfers. Runs once per deal (transaction + unique reference).
async function payout(path) {
  const ref = fs.doc(path);
  const d = await fs.runTransaction(async t => {
    const s = await t.get(ref);
    if (!s.exists || s.data().status !== 'HOLDING') return null;
    t.update(ref, {status: 'PAYING_OUT'});
    return s.data();
  });
  if (!d) return {ok: false, error: 'This deal is not in HOLDING.'};
  try {
    const po = (await fs.doc('payouts/' + ref.id).get()).data();
    const rc = await ps('POST', '/transferrecipient', {type: 'nuban', name: po.accountName, account_number: po.account, bank_code: po.bankCode, currency: 'NGN'});
    if (!rc.status) throw new Error(rc.message);
    const reference = 'po-' + ref.id.toLowerCase();
    await fs.doc('transfers/' + reference).set({path});
    const tr = await ps('POST', '/transfer', {source: 'balance', amount: (d.amount - d.fee) * 100, recipient: rc.data.recipient_code, reason: 'SafeTrade payout', reference});
    if (!tr.status) throw new Error(tr.message);
    await ref.update({transferCode: tr.data.transfer_code, transferStatus: tr.data.status});
    return {ok: true};
  } catch (e) {
    await ref.update({status: 'PAYOUT_FAILED', payoutError: String(e.message).slice(0, 200)});
    return {ok: false, error: e.message};
  }
}
module.exports = {admin, fs, ps, J, sha, payout, PATH};
