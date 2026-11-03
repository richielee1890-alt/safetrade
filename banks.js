const {ps, J} = require('./_lib');
let cache;
exports.handler = async () => {
  if (!cache) { const r = await ps('GET', '/bank?country=nigeria&currency=NGN&perPage=200'); if (!r.status) return J(502, {error: r.message}); cache = r.data.filter(b => b.active).map(b => ({name: b.name, code: b.code})).sort((a, b) => a.name.localeCompare(b.name)); }
  return J(200, cache);
};
