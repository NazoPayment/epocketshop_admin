export const PERIODS = [
  {value: 'today', label: 'Today'},
  {value: 'yesterday', label: 'Yesterday'},
  {value: 'this_week', label: 'This week'},
  {value: 'last_week', label: 'Last week'},
  {value: 'this_month', label: 'This month'},
  {value: 'last_month', label: 'Last month'},
  {value: 'this_year', label: 'This year'},
  {value: 'last_year', label: 'Last year'},
];

export const PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Refund', 'Cancelled'];

export function statusVariant(status) {
  switch (String(status).toLowerCase()) {
    case 'paid':
      return 'success';
    case 'unpaid':
      return 'warning';
    case 'refund':
      return 'info';
    case 'cancelled':
      return 'error';
    default:
      return 'neutral';
  }
}

/** Normalise one row of /get_all_period_invoices (keys are human-readable, as in invoiceModel.dart). */
export function normalizeInvoice(row = {}) {
  return {
    number: row['Invoice Number'] ?? 0,
    date: row['Invoice Date'] ?? '',
    status: row['Invoice Status'] ?? '',
    phone: row['Customer Phone Number'] ?? '',
    documentName: row['Invoice Document Name'] ?? '',
    type: row['Invoice Type'] ?? '',
    note: row['Customer Note'] ?? '',
    total: Number(row['Invoice Total'] ?? 0) || 0,
  };
}

export function parseInvoices(data) {
  return Array.isArray(data) ? data.map(normalizeInvoice) : [];
}

export function summarise(invoices) {
  const paid = invoices.filter((i) => i.status.toLowerCase() === 'paid');
  const revenue = paid.reduce((sum, i) => sum + i.total, 0);
  const unpaid = invoices.filter((i) => i.status.toLowerCase() === 'unpaid');
  const outstanding = unpaid.reduce((sum, i) => sum + i.total, 0);
  const counts = {};
  for (const i of invoices) counts[i.status || 'Unknown'] = (counts[i.status || 'Unknown'] || 0) + 1;
  return {
    revenue,
    outstanding,
    orders: invoices.length,
    paidCount: paid.length,
    unpaidCount: unpaid.length,
    average: paid.length ? revenue / paid.length : 0,
    counts,
  };
}

export function toCsv(rows, columns) {
  const esc = (v) => {
    const s = String(v ?? '');
    // Neutralise spreadsheet formula injection from customer-supplied text.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const head = columns.map((c) => esc(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.value(r))).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], {type: mime}));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
