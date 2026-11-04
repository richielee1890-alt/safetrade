const {fs, J, sha, payout, PATH} = require('./_lib');
exports.handler = async ev => {
  if (ev.httpMethod !== 'POST') return J(405, {error: 'POST only'});
  let b; try { b = JSON.parse(ev.body); } catch (e) { return J(400, {error: 'Bad request'}); }
  if (!PATH.test(b.path || '') || !b.token) return J(400, {error: 'Bad request'});
  const ref = fs.doc(b.path), s = await ref.get();
  if (!s.exists || !s.data().tokenHash || sha(b.token) !== s.data().tokenHash) return J(403, {error: 'Wrong release code for this deal.'});
  if (b.action === 'release') { const r = await payout(b.path); return r.ok ? J(200, {ok: true}) : J(409, {error: r.error}); }
  if (b.action === 'dispute') { if (s.data().status !== 'HOLDING') return J(409, {error: 'Cannot dispute now.'}); await ref.update({status: 'DISPUTED'}); return J(200, {ok: true}); }
  return J(400, {error: 'Unknown action'});
};
