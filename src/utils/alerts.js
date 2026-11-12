import {LOW_STOCK, UNPAID_ALERT_HOURS} from './constants.js';
import {formatRand} from './format.js';

/**
 * Turns the latest orders + products into a list of alerts.
 * - `seenOrders` is the set of order numbers the vendor has already looked at.
 * - Pure function so it is easy to test.
 */
export function buildAlerts({invoices = [], products = [], seenOrders = new Set(), now = Date.now()}) {
  const alerts = [];

  const fresh = invoices.filter((i) => !seenOrders.has(i.number));
  for (const o of fresh) {
    alerts.push({
      id: `order-${o.number}`,
      kind: 'order',
      title: `New order #${o.number}`,
      body: `${formatRand(o.total)}${o.phone ? ` from ${o.phone}` : ''}`,
      to: `/orders?q=${o.number}`,
    });
  }

  const cutoff = now - UNPAID_ALERT_HOURS * 3600 * 1000;
  const stale = invoices.filter((i) => i.status.toLowerCase() === 'unpaid' && new Date(i.date).getTime() < cutoff);
  if (stale.length) {
    alerts.push({
      id: `unpaid-${stale.map((s) => s.number).join('-')}`,
      kind: 'unpaid',
      title: `${stale.length} unpaid ${stale.length === 1 ? 'order' : 'orders'} older than ${UNPAID_ALERT_HOURS}h`,
      body: `${formatRand(stale.reduce((s, i) => s + i.total, 0))} still waiting for payment`,
      to: '/orders',
    });
  }

  const live = products.filter((p) => !p.is_paused);
  const out = live.filter((p) => Number(p.available_stock) <= 0);
  const low = live.filter((p) => Number(p.available_stock) > 0 && Number(p.available_stock) <= LOW_STOCK);
  if (out.length) {
    alerts.push({
      id: `out-${out.map((p) => p.id).join('-')}`,
      kind: 'stock',
      title: `${out.length} ${out.length === 1 ? 'product is' : 'products are'} out of stock`,
      body: out.slice(0, 3).map((p) => p.name).join(', ') + (out.length > 3 ? '…' : ''),
      to: '/products',
    });
  }
  if (low.length) {
    alerts.push({
      id: `low-${low.map((p) => p.id).join('-')}`,
      kind: 'stock',
      title: `${low.length} ${low.length === 1 ? 'product is' : 'products are'} running low`,
      body: low.slice(0, 3).map((p) => `${p.name} (${p.available_stock})`).join(', ') + (low.length > 3 ? '…' : ''),
      to: '/products',
    });
  }

  return alerts;
}
