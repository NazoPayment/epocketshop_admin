import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Badge} from '@astryxdesign/core/Badge';
import {Banner} from '@astryxdesign/core/Banner';
import {Check, Circle} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Notice from '../components/Notice.jsx';
import QrCard from '../components/QrCard.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import RevenueChart from '../components/RevenueChart.jsx';
import {useAlerts} from '../context/AlertsContext.jsx';
import {invoiceApi} from '../api/services.js';
import {LOW_STOCK} from '../utils/constants.js';
import {parseInvoices, summarise} from '../utils/orders.js';
import {formatDate, formatNumber, formatRand} from '../utils/format.js';

const DASH_PERIODS = [
  {value: 'today', label: 'Today'},
  {value: 'this_week', label: 'Week'},
  {value: 'this_month', label: 'Month'},
  {value: 'this_year', label: 'Year'},
];

const FREE_PLAN_REVENUE_CAP = 5000;

export default function Dashboard() {
  const {business, vendor} = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('this_month');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const {products} = useAlerts();
  const productCount = products.length;
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    invoiceApi.list(business.businessId, period).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setInvoices(parseInvoices(res.data));
        setNotice(null);
      } else {
        setInvoices([]);
        setNotice({status: 'error', title: 'Could not load orders', description: res.message});
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [business.businessId, period]);

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => !p.is_paused && Number(p.available_stock) <= LOW_STOCK)
        .sort((a, b) => Number(a.available_stock) - Number(b.available_stock))
        .slice(0, 6),
    [products],
  );

  const stats = useMemo(() => summarise(invoices), [invoices]);
  const recent = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6),
    [invoices],
  );

  const steps = [
    {
      done: (productCount ?? 0) > 0,
      title: 'Add your products',
      body: 'Upload photos, prices and stock so customers have something to buy.',
      action: 'Add products',
      to: '/products',
    },
    {
      done: Boolean(vendor?.bank_details?.account_number),
      title: 'Add payout details',
      body: 'Tell us where to settle your money.',
      action: 'Add bank details',
      to: '/settings',
    },
    {
      done: business.verificationLevel !== 'false',
      title: 'Get verified',
      body: 'Verified stores earn more trust from buyers.',
      action: 'Start verification',
      to: '/verification',
    },
    {
      done: false,
      title: 'Share your store',
      body: 'Send your link on WhatsApp, Instagram or print the QR code.',
      action: 'Open sales channels',
      to: '/channels',
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const showCapBanner = business.subscription === 0 && stats.revenue >= FREE_PLAN_REVENUE_CAP;

  return (
    <>
      <PageHeader
        title={`Hello, ${vendor?.name || business.businessName}`}
        description="Here's how your store is doing across every channel."
        actions={
          <SegmentedControl label="Reporting period" value={period} onChange={setPeriod} size="sm">
            {DASH_PERIODS.map((p) => (
              <SegmentedControlItem key={p.value} value={p.value} label={p.label} />
            ))}
          </SegmentedControl>
        }
      />

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      {showCapBanner ? (
        <Banner
          status="warning"
          title="You've reached the Free plan sales limit"
          description="Upgrade to keep selling without limits and unlock insights."
          collapsible={false}
          endContent={<Button label="See plans" size="sm" onClick={() => navigate('/billing')} />}
        />
      ) : null}

      <section className="stat-grid" aria-label="Key numbers">
        <StatCard label="Revenue (paid)" value={formatRand(stats.revenue)} isLoading={loading} hint={`${stats.paidCount} paid orders`} />
        <StatCard label="Orders" value={formatNumber(stats.orders)} isLoading={loading} hint="All statuses" />
        <StatCard label="Awaiting payment" value={formatRand(stats.outstanding)} isLoading={loading} hint={`${stats.unpaidCount} unpaid orders`} />
        <StatCard label="Average order" value={formatRand(stats.average)} isLoading={loading} hint="Paid orders only" />
      </section>

      <Card>
        <VStack gap={3}>
          <Heading level={3}>Revenue</Heading>
          <RevenueChart invoices={invoices} byMonth={period === 'this_year'} />
        </VStack>
      </Card>

      <div className="two-col">
        <VStack gap={4}>
        <Card>
          <VStack gap={4}>
            <HStack hAlign="between" vAlign="center">
              <Heading level={3}>Recent orders</Heading>
              <Button label="View all" variant="ghost" size="sm" onClick={() => navigate('/orders')} />
            </HStack>
            {recent.length === 0 ? (
              <Text type="supporting">
                {loading ? 'Loading orders…' : 'No orders in this period yet. Share your store link to get your first one.'}
              </Text>
            ) : (
              <div className="table-scroll">
              <Table density="compact" idKey="number" dividers="rows">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Order</TableHeaderCell>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((o) => (
                    <TableRow key={o.number}>
                      <TableCell>#{o.number}</TableCell>
                      <TableCell>{formatDate(o.date)}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>{formatRand(o.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </VStack>
        </Card>
        <QrCard />
        </VStack>

        <Card>
          <VStack gap={4}>
            <HStack hAlign="between" vAlign="center">
              <Heading level={3}>Get your store ready</Heading>
              <Badge variant={doneCount === steps.length ? 'success' : 'neutral'} label={`${doneCount}/${steps.length} done`} />
            </HStack>
            <ProgressBar label="Setup progress" isLabelHidden value={doneCount} max={steps.length} variant="accent" />
            <VStack gap={3}>
              {steps.map((s) => (
                <HStack key={s.title} gap={3} vAlign="start">
                  {s.done ? <Check size={18} aria-label="Done" /> : <Circle size={18} aria-label="To do" />}
                  <VStack gap={0.5}>
                    <Text weight="semibold">{s.title}</Text>
                    <Text type="supporting">{s.body}</Text>
                    {s.done ? null : (
                      <div>
                        <Button label={s.action} size="sm" variant="secondary" onClick={() => navigate(s.to)} />
                      </div>
                    )}
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </Card>
      </div>

      {lowStock.length > 0 ? (
        <Card>
          <VStack gap={3}>
            <HStack hAlign="between" vAlign="center">
              <Heading level={3}>Needs restocking</Heading>
              <Button label="Manage products" variant="ghost" size="sm" onClick={() => navigate('/products')} />
            </HStack>
            {lowStock.map((p) => (
              <HStack key={p.id} hAlign="between" vAlign="center" gap={3}>
                <Text weight="medium">{p.name}</Text>
                <Badge
                  variant={Number(p.available_stock) <= 0 ? 'error' : 'warning'}
                  label={Number(p.available_stock) <= 0 ? 'Out of stock' : `${p.available_stock} left`}
                />
              </HStack>
            ))}
          </VStack>
        </Card>
      ) : null}

      <Card>
        <VStack gap={3}>
          <Heading level={3}>Orders by status</Heading>
          {Object.keys(stats.counts).length === 0 ? (
            <Text type="supporting">Nothing to show for this period.</Text>
          ) : (
            Object.entries(stats.counts).map(([status, count]) => (
              <ProgressBar
                key={status}
                label={`${status}: ${count}`}
                value={count}
                max={Math.max(stats.orders, 1)}
                variant={status.toLowerCase() === 'paid' ? 'success' : status.toLowerCase() === 'unpaid' ? 'accent' : status.toLowerCase() === 'cancelled' ? 'error' : 'neutral'}
                hasValueLabel
                formatValueLabel={(v) => `${v}`}
              />
            ))
          )}
        </VStack>
      </Card>
    </>
  );
}
