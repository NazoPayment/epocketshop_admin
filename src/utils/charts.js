/** Groups paid orders into day buckets (month buckets for the year view). */
export function bucketRevenue(invoices, byMonth) {
  const map = new Map();
  for (const i of invoices) {
    if (i.status.toLowerCase() !== 'paid') continue;
    const d = new Date(i.date);
    if (Number.isNaN(d.getTime())) continue;
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const key = byMonth ? month : `${month}-${String(d.getDate()).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + i.total);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([key, total]) => ({key, total}));
}
