const rand = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  currencyDisplay: 'narrowSymbol',
});

/** Invoice totals come from the API in rands. */
export function formatRand(amount) {
  const n = Number(amount);
  return rand.format(Number.isFinite(n) ? n : 0);
}

/** Product prices are stored as integer cents. */
export function formatCents(cents) {
  const n = Number(cents);
  return rand.format(Number.isFinite(n) ? n / 100 : 0);
}

export function centsToInput(cents) {
  const n = Number(cents);
  return Number.isFinite(n) ? (n / 100).toFixed(2) : '';
}

export function inputToCents(value) {
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-ZA', {day: 'numeric', month: 'short', year: 'numeric'});
}

export function formatNumber(n) {
  return new Intl.NumberFormat('en-ZA').format(Number(n) || 0);
}

/** Read a File as a raw base64 string (no data: prefix), as the products API expects. */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Read a File as a data URI, as the business logo API expects. */
export function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function planName(tier) {
  switch (Number(tier)) {
    case 0:
      return 'Free';
    case 1:
      return 'Starterpack';
    case 2:
      return 'Professional';
    case 3:
      return 'Enterprise';
    case 10:
      return 'Hourly';
    case 100:
      return 'Test';
    default:
      return 'Premium';
  }
}

export function storefrontLink(base, businessName) {
  return `${base.replace(/\/$/, '')}/${encodeURIComponent(businessName || '')}`;
}
