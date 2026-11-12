import {describe, expect, it} from 'vitest';

import {parseCsv, parseCsvObjects, parseMoney} from './csv.js';
import {downloadText, normalizeInvoice, summarise, toCsv} from './orders.js';
import {buildAlerts} from './alerts.js';
import {inSegment} from './segments.js';
import {buildReceiptHtml} from './print.js';
import {centsToInput, inputToCents, planName, storefrontLink} from './format.js';
import {toE164} from '../api/services.js';
import {bucketRevenue} from './charts.js';

describe('csv', () => {
  it('parses quoted fields, escaped quotes and CRLF', () => {
    const rows = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n');
    expect(rows).toEqual([['a', 'b'], ['x, y', 'say "hi"']]);
  });

  it('parses objects with lower-cased headers and skips blank lines', () => {
    const out = parseCsvObjects('Name,Price\nTea,12.5\n\n');
    expect(out).toEqual([{name: 'Tea', price: '12.5'}]);
  });

  it('parses rand amounts typed by people', () => {
    expect(parseMoney('R 1 250,50')).toBe(1250.5);
    expect(parseMoney('1,250.50')).toBe(1250.5);
    expect(parseMoney('abc')).toBeNaN();
  });

  it('neutralises spreadsheet formulas on export', () => {
    const csv = toCsv([{n: '=HYPERLINK("x")'}, {n: 'ok'}], [{header: 'n', value: (r) => r.n}]);
    expect(csv.split('\n')[1].startsWith("\"'=")).toBe(true);
    expect(csv).toContain('ok');
  });
});

describe('orders', () => {
  const rows = [
    {'Invoice Number': 1, 'Invoice Date': '2026-11-01', 'Invoice Status': 'Paid', 'Invoice Total': 100},
    {'Invoice Number': 2, 'Invoice Date': '2026-11-01', 'Invoice Status': 'Paid', 'Invoice Total': 50},
    {'Invoice Number': 3, 'Invoice Date': '2026-11-02', 'Invoice Status': 'Unpaid', 'Invoice Total': 70},
  ].map(normalizeInvoice);

  it('summarises revenue only from paid orders', () => {
    const s = summarise(rows);
    expect(s.revenue).toBe(150);
    expect(s.outstanding).toBe(70);
    expect(s.orders).toBe(3);
    expect(s.average).toBe(75);
  });

  it('buckets paid revenue by day and by month', () => {
    expect(bucketRevenue(rows, false)).toEqual([{key: '2026-11-01', total: 150}]);
    expect(bucketRevenue(rows, true)).toEqual([{key: '2026-11', total: 150}]);
  });

  it('exports downloadText as a function', () => {
    expect(typeof downloadText).toBe('function');
  });
});

describe('alerts', () => {
  const now = new Date('2026-11-12T12:00:00Z').getTime();
  const inv = (number, status, date) => normalizeInvoice({
    'Invoice Number': number, 'Invoice Status': status, 'Invoice Date': date, 'Invoice Total': 10,
  });

  it('flags unseen orders, stale unpaid orders and stock problems', () => {
    const alerts = buildAlerts({
      invoices: [inv(1, 'Paid', '2026-11-12T10:00:00Z'), inv(2, 'Unpaid', '2026-11-10T10:00:00Z')],
      products: [
        {id: 1, name: 'A', available_stock: 0, is_paused: false},
        {id: 2, name: 'B', available_stock: 3, is_paused: false},
        {id: 3, name: 'C', available_stock: 0, is_paused: true},
        {id: 4, name: 'D', available_stock: 50, is_paused: false},
      ],
      seenOrders: new Set([2]),
      now,
    });
    const kinds = alerts.map((a) => a.id.split('-')[0]);
    expect(kinds).toEqual(['order', 'unpaid', 'out', 'low']);
    expect(alerts.find((a) => a.id.startsWith('out')).body).toBe('A');
  });

  it('is quiet when everything has been seen and stock is healthy', () => {
    expect(buildAlerts({invoices: [inv(1, 'Paid', '2026-11-12T10:00:00Z')], products: [], seenOrders: new Set([1]), now})).toEqual([]);
  });
});

describe('segments', () => {
  const now = new Date('2026-11-12T00:00:00Z').getTime();
  const customers = [
    {phone_number: '1', order_count: 5, total_spent: 900, last_purchase_date: '2026-11-01'},
    {phone_number: '2', order_count: 1, total_spent: 50, last_purchase_date: '2026-08-01'},
    {phone_number: '3', order_count: 0, total_spent: 0, last_purchase_date: ''},
  ];

  it('classifies customers', () => {
    expect(customers.filter((c) => inSegment(c, 'repeat', customers, now)).map((c) => c.phone_number)).toEqual(['1']);
    expect(customers.filter((c) => inSegment(c, 'new', customers, now)).map((c) => c.phone_number)).toEqual(['2', '3']);
    expect(customers.filter((c) => inSegment(c, 'inactive', customers, now)).map((c) => c.phone_number)).toEqual(['2', '3']);
    expect(customers.filter((c) => inSegment(c, 'top', customers, now)).map((c) => c.phone_number)).toEqual(['1', '2']);
    expect(customers.filter((c) => inSegment(c, 'all', customers, now))).toHaveLength(3);
  });
});

describe('receipt', () => {
  it('escapes customer-supplied text', () => {
    const html = buildReceiptHtml({
      businessName: '<b>Shop</b>',
      order: {number: 1, date: '2026-11-01', status: 'Paid', total: 10, note: '<script>alert(1)</script>', phone: ''},
      invoice: {products: [{name: '<img src=x onerror=1>', extras: '', order_quantity: 1, price: 10, total: 10}], sub_total: 10, grand_total: 10},
    });
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });
});

describe('format + api helpers', () => {
  it('converts cents and rands both ways', () => {
    expect(centsToInput(3550)).toBe('35.50');
    expect(inputToCents('35,50')).toBe(3550);
  });

  it('normalises South African phone numbers', () => {
    expect(toE164('082 123 4567')).toBe('+27821234567');
    expect(toE164('+27821234567')).toBe('+27821234567');
    expect(toE164('27821234567')).toBe('+27821234567');
  });

  it('names plans and builds store links', () => {
    expect(planName(0)).toBe('Free');
    expect(planName(1)).toBe('Starterpack');
    expect(storefrontLink('https://epocketshop.store/', 'mamas kitchen')).toBe('https://epocketshop.store/mamas%20kitchen');
  });
});
