const {ps, J} = require('./_lib');
exports.handler = async ev => {
  if (ev.httpMethod !== 'POST') return J(405, {error: 'POST only'});
  let b; try { b = JSON.parse(ev.body); } catch (e) { return J(400, {error: 'Bad request'}); }
  const acct = String(b.account || ''), bank = String(b.bankCode || '');
  if (!/^\d{10}$/.test(acct) || !/^\d{2,6}$/.test(bank)) return J(400, {error: 'Bad request'});
  try {
    const r = await ps('GET', `/bank/resolve?account_number=${acct}&bank_code=${bank}`);
    if (r.status && r.data) return J(200, {ok: true, accountName: r.data.account_name});
    return J(200, {ok: false, error: r.message || 'Could not verify this account.', manual: process.env.ALLOW_MANUAL_NAME === '1'});
  } catch (e) { return J(200, {ok: false, error: 'Could not reach Paystack: ' + e.message, manual: false}); }
};
