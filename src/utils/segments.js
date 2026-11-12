export const SEGMENTS = [
  {value: 'all', label: 'All'},
  {value: 'repeat', label: 'Repeat buyers'},
  {value: 'new', label: 'New'},
  {value: 'inactive', label: 'Inactive 60d+'},
  {value: 'top', label: 'Top spenders'},
];

export const INACTIVE_DAYS = 60;
export const TOP_SPENDERS = 10;

/** Customer segment membership. */
export function inSegment(c, segment, all, now = Date.now()) {
  switch (segment) {
    case 'repeat':
      return Number(c.order_count) > 1;
    case 'new':
      return Number(c.order_count) <= 1;
    case 'inactive': {
      const t = new Date(c.last_purchase_date).getTime();
      return Number.isNaN(t) || now - t > INACTIVE_DAYS * 86400000;
    }
    case 'top': {
      const top = [...all].sort((a, b) => Number(b.total_spent) - Number(a.total_spent)).slice(0, TOP_SPENDERS);
      return top.includes(c) && Number(c.total_spent) > 0;
    }
    default:
      return true;
  }
}
