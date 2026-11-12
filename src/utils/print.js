import {formatDate, formatRand} from './format.js';

const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/** Builds a self-contained, print-friendly HTML receipt / packing slip. All values are escaped. */
export function buildReceiptHtml({businessName, order, invoice, delivery, customer}) {
  const items = Array.isArray(invoice?.products) ? invoice.products : [];
  const rows = items
    .map(
      (p) => `<tr>
        <td>${escapeHtml(p.name)}${p.extras ? `<div class="muted">${escapeHtml(p.extras)}</div>` : ''}</td>
        <td class="num">${escapeHtml(p.order_quantity)}</td>
        <td class="num">${escapeHtml(formatRand(p.price))}</td>
        <td class="num">${escapeHtml(formatRand(p.total))}</td>
      </tr>`,
    )
    .join('');

  const line = (label, value) => (value ? `<p><span class="muted">${escapeHtml(label)}</span> ${escapeHtml(value)}</p>` : '');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Order #${escapeHtml(order.number)}</title>
<style>
  *{box-sizing:border-box} body{font:14px/1.45 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111;margin:32px;max-width:720px}
  h1{font-size:20px;margin:0 0 4px} .muted{color:#666} p{margin:2px 0}
  table{width:100%;border-collapse:collapse;margin:20px 0} th,td{padding:8px 6px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}
  .num{text-align:right;white-space:nowrap} .total td{font-weight:700;border-top:2px solid #111;border-bottom:0}
  .status{display:inline-block;padding:2px 10px;border:1px solid #111;border-radius:999px;font-size:12px}
  @media print{body{margin:0}}
</style></head><body>
  <h1>${escapeHtml(businessName)}</h1>
  <p class="muted">Order #${escapeHtml(order.number)} · ${escapeHtml(formatDate(order.date))}</p>
  <p><span class="status">${escapeHtml(order.status || 'Unknown')}</span></p>
  <div style="margin-top:16px">
    ${line('Customer:', customer?.customer_name)}
    ${line('Phone:', order.phone)}
    ${line('Delivery:', delivery?.delivery_details_type?.replace(/_/g, ' '))}
    ${line('Deliver to:', delivery?.delivery_details_destination)}
    ${line('Note:', invoice?.customer_note || order.note)}
  </div>
  <table>
    <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" class="muted">No line items</td></tr>'}
      ${invoice ? `<tr><td colspan="3" class="num muted">Subtotal</td><td class="num">${escapeHtml(formatRand(invoice.sub_total))}</td></tr>` : ''}
      ${delivery?.delivery_details_cost ? `<tr><td colspan="3" class="num muted">Delivery</td><td class="num">${escapeHtml(formatRand(delivery.delivery_details_cost))}</td></tr>` : ''}
      <tr class="total"><td colspan="3" class="num">Total</td><td class="num">${escapeHtml(formatRand(invoice?.grand_total ?? order.total))}</td></tr>
    </tbody>
  </table>
</body></html>`;
}

/** Prints HTML through a hidden iframe, which avoids popup blockers. */
export function printHtml(html) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 1500);
  };
  document.body.appendChild(frame);
}
