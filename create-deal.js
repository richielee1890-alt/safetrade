const {admin, fs, ps, J} = require('./_lib');
exports.handler = async ev => {
  if (ev.httpMethod !== 'POST') return J(405, {error: 'POST only'});
  let b; try { b = JSON.parse(ev.body); } catch (e) { return J(400, {error: 'Bad request'}); }
  const item = String(b.item || '').trim(), name = String(b.sellerName || '').trim(), phone = String(b.sellerPhone || ''), acct = String(b.account || ''), bank = String(b.bankCode || ''), amount = Math.round(Number(b.amount));
  if (item.length < 2 || item.length > 80 || name.length < 2 || name.length > 60) return J(400, {error: 'Check the item and your name.'});
  if (!/^0\d{10}$/.test(phone) || !/^\d{10}$/.test(acct) || !/^\d{2,6}$/.test(bank)) return J(400, {error: 'Check phone (11 digits), account (10 digits) and bank.'});
  if (!(amount >= 1000 && amount <= 50000000)) return J(400, {error: 'Amount must be ₦1,000 to ₦50,000,000.'});
  const r = await ps('GET', `/bank/resolve?account_number=${acct}&bank_code=${bank}`);
  if (!r.status) return J(400, {error: 'Could not verify that bank account.'});
  const dr = fs.collection(`sellers/${phone}/deals`).doc(), ts = admin.firestore.FieldValue.serverTimestamp();
  const batch = fs.batch();
  batch.set(dr, {item, sellerName: name, sellerPhone: phone, amount, fee: Math.round(amount * 0.03), accountName: r.data.account_name, acctLast4: acct.slice(-4), status: 'AWAITING_PAYMENT', createdAt: ts});
  batch.set(fs.doc('payouts/' + dr.id), {bankCode: bank, account: acct, accountName: r.data.account_name, sellerPhone: phone});
  await batch.commit();
  return J(200, {id: dr.id, phone, accountName: r.data.account_name});
};
