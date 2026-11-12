import {useCallback, useEffect, useMemo, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Selector} from '@astryxdesign/core/Selector';
import {Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VisuallyHidden} from '@astryxdesign/core/VisuallyHidden';
import {Download} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import OrderDialog from '../components/OrderDialog.jsx';
import Notice from '../components/Notice.jsx';
import Loading from '../components/Loading.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {invoiceApi} from '../api/services.js';
import {PAYMENT_STATUSES, PERIODS, downloadText, parseInvoices, summarise, toCsv} from '../utils/orders.js';
import {formatDate, formatNumber, formatRand} from '../utils/format.js';

export default function Orders() {
  const {business} = useAuth();
  const [period, setPeriod] = useState('this_month');
  const [statusFilter, setStatusFilter] = useState('all');
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(null);

  // A search link opens this page with ?q=1043 (and a wide period so older orders are found).
  useEffect(() => {
    if (params.get('q')) {
      setPeriod('this_year');
      setParams({}, {replace: true});
    }
  }, [params, setParams]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await invoiceApi.list(business.businessId, period);
    if (res.ok) {
      setOrders(parseInvoices(res.data));
      setNotice(null);
    } else {
      setOrders([]);
      setNotice({status: 'error', title: 'Could not load orders', description: res.message});
    }
    setLoading(false);
  }, [business.businessId, period]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return orders
      .filter((o) => {
        if (from === null && to === null) return true;
        const t = new Date(o.date).getTime();
        return !Number.isNaN(t) && (from === null || t >= from) && (to === null || t <= to);
      })
      .filter((o) => statusFilter === 'all' || o.status.toLowerCase() === statusFilter.toLowerCase())
      .filter(
        (o) =>
          !q ||
          String(o.number).includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.note.toLowerCase().includes(q),
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, statusFilter, query, dateFrom, dateTo]);

  const stats = useMemo(() => summarise(filtered), [filtered]);

  function exportCsv() {
    const csv = toCsv(filtered, [
      {header: 'Order', value: (o) => o.number},
      {header: 'Date', value: (o) => o.date},
      {header: 'Status', value: (o) => o.status},
      {header: 'Customer phone', value: (o) => o.phone},
      {header: 'Type', value: (o) => o.type},
      {header: 'Total (ZAR)', value: (o) => o.total.toFixed(2)},
      {header: 'Note', value: (o) => o.note},
    ]);
    downloadText(`orders-${period}.csv`, csv);
  }

  function handleStatusChanged(number, status) {
    setOrders((list) => list.map((o) => (o.number === number ? {...o, status} : o)));
    setSelected((s) => (s && s.number === number ? {...s, status} : s));
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order from your storefront, WhatsApp, Instagram and till, in one list."
        actions={
          <Button
            label="Export CSV"
            icon={<Download size={16} />}
            isDisabled={filtered.length === 0}
            onClick={exportCsv}
          />
        }
      />

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      <section className="stat-grid" aria-label="Order summary">
        <StatCard label="Orders" value={formatNumber(stats.orders)} isLoading={loading} />
        <StatCard label="Paid revenue" value={formatRand(stats.revenue)} isLoading={loading} />
        <StatCard label="Awaiting payment" value={formatRand(stats.outstanding)} isLoading={loading} />
      </section>

      <div className="toolbar">
        <div className="grow">
          <TextInput
            label="Search"
            placeholder="Order number, phone or note"
            startIcon="search"
            hasClear
            value={query}
            onChange={setQuery}
          />
        </div>
        <Selector
          label="Period"
          value={period}
          onChange={setPeriod}
          options={PERIODS}
          width={180}
        />
        <Selector
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{value: 'all', label: 'All statuses'}, ...PAYMENT_STATUSES.map((s) => ({value: s, label: s}))]}
          width={180}
        />
        <label className="date-field">
          <span>From</span>
          <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="date-field">
          <span>To</span>
          <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        {dateFrom || dateTo ? (
          <Button label="Clear dates" variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }} />
        ) : null}
      </div>

      {loading ? (
        <Loading label="Loading orders" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={
            orders.length === 0
              ? 'Orders placed in this period will appear here. Share your store link to get started.'
              : 'Try a different search or status filter.'
          }
        />
      ) : (
        <div className="table-wrap">
          <Table hasHover density="balanced" idKey="number">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Order</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>
                  <VisuallyHidden>Actions</VisuallyHidden>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.number}>
                  <TableCell>
                    <Text weight="medium">#{o.number}</Text>
                  </TableCell>
                  <TableCell>{formatDate(o.date)}</TableCell>
                  <TableCell>{o.phone || '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>{formatRand(o.total)}</TableCell>
                  <TableCell>
                    <Button label="View" size="sm" variant="ghost" onClick={() => setSelected(o)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selected ? (
        <OrderDialog order={selected} onClose={() => setSelected(null)} onStatusChanged={handleStatusChanged} />
      ) : null}
    </>
  );
}
