const {ps, J} = require('./_lib');
let cache;
exports.handler = async () => {
  if (!cache) {
    let all = [], next = '';
    for (let i = 0; i < 6; i++) {                       // Paystack pages its bank list, follow the cursor
      const r = await ps('GET', '/bank?country=nigeria&currency=NGN&perPage=100' + (next ? '&next=' + encodeURIComponent(next) : ''));
      if (!r.status) return J(502, {error: r.message || 'Paystack error'});
      all = all.concat(r.data || []);
      next = r.meta && r.meta.next;
      if (!next) break;
    }
    const seen = new Set();
    cache = all.filter(b => b.active !== false && !b.is_deleted && !seen.has(b.name + b.code) && seen.add(b.name + b.code))
      .map(b => ({name: b.name, code: b.code})).sort((a, b) => a.name.localeCompare(b.name));
  }
  return J(200, cache);
};
