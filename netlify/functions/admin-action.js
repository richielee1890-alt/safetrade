const {admin, fs, ps, J, payout, PATH} = require('./_lib');
exports.handler = async ev => {
  if (ev.httpMethod !== 'POST') return J(405, {error: 'POST only'});
  let b; try { b = JSON.parse(ev.body); } catch (e) { return J(400, {error: 'Bad request'}); }
  try { const u = await admin.auth().verifyIdToken(b.idToken); if (u.uid !== process.env.ADMIN_UID) return J(403, {error: 'Not admin'}); } catch (e) { return J(401, {error: 'Sign in again'}); }
  if (!PATH.test(b.path || '')) return J(400, {error: 'Bad request'});
  const ref = fs.doc(b.path), d = (await ref.get()).data() || {};
  if (b.action === 'release') {
    if (['DISPUTED', 'PAYOUT_FAILED'].includes(d.status)) await ref.update({status: 'HOLDING'});
    const r = await payout(b.path); return r.ok ? J(200, {ok: true}) : J(409, {error: r.error});
  }
  if (b.action === 'refund') {
    if (!['HOLDING', 'DISPUTED', 'PAYOUT_FAILED'].includes(d.status) || !d.payRef) return J(409, {error: 'Cannot refund this deal.'});
    const r = await ps('POST', '/refund', {transaction: d.payRef}); if (!r.status) return J(502, {error: r.message});
    await ref.update({status: 'REFUNDED'}); return J(200, {ok: true});
  }
  if (b.action === 'cancel') { if (d.status !== 'AWAITING_PAYMENT') return J(409, {error: 'Only unpaid deals can be cancelled.'}); await ref.update({status: 'CANCELLED'}); return J(200, {ok: true}); }
  return J(400, {error: 'Unknown action'});
};
