import {useCallback, useEffect, useMemo, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {HStack} from '@astryxdesign/core/HStack';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';
import {VisuallyHidden} from '@astryxdesign/core/VisuallyHidden';
import {MessageSquare} from 'lucide-react';
import {useNavigate} from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import CustomerDialog from '../components/CustomerDialog.jsx';
import MobileCardList from '../components/MobileCardList.jsx';
import Notice from '../components/Notice.jsx';
import Loading from '../components/Loading.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {customerApi} from '../api/services.js';
import {formatDate, formatNumber, formatRand} from '../utils/format.js';
import {SEGMENTS, inSegment} from '../utils/segments.js';

const SMS_MAX = 160;

function displayName(c) {
  const full = [c.name, c.surname].filter(Boolean).join(' ').trim();
  return full || c.phone_number || 'Unknown customer';
}

export default function Customers() {
  const {business} = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [tier, setTier] = useState(0);
  const [limited, setLimited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [segment, setSegment] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await customerApi.list(business.businessId);
    if (res.ok) {
      setCustomers(Array.isArray(res.data?.customers) ? res.data.customers : []);
      setTier(res.data?.subscription_tier ?? 0);
      setLimited(Boolean(res.data?.is_limited));
      setNotice(null);
    } else {
      setCustomers([]);
      setNotice({status: 'error', title: 'Could not load customers', description: res.message});
    }
    setLoading(false);
  }, [business.businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const segmentCounts = useMemo(() => {
    const counts = {};
    for (const s of SEGMENTS) counts[s.value] = customers.filter((c) => inSegment(c, s.value, customers)).length;
    return counts;
  }, [customers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) => tier < 1 || inSegment(c, segment, customers))
      .filter(
        (c) =>
          !q ||
          `${c.name || ''} ${c.surname || ''} ${c.phone_number || ''} ${c.email || ''}`.toLowerCase().includes(q),
      );
  }, [customers, query, segment, tier]);

  const totals = useMemo(() => {
    const spent = customers.reduce((s, c) => s + (Number(c.total_spent) || 0), 0);
    const repeat = customers.filter((c) => Number(c.order_count) > 1).length;
    return {spent, repeat};
  }, [customers]);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has bought from you, whichever channel they used."
        actions={
          <Button
            label={segment === 'all' || tier < 1 ? 'Message customers' : `Message ${SEGMENTS.find((s) => s.value === segment)?.label.toLowerCase()}`}
            icon={<MessageSquare size={16} />}
            isDisabled={filtered.length === 0}
            onClick={() => setBroadcastOpen(true)}
          />
        }
      />

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      {limited || tier < 1 ? (
        <Banner
          status="info"
          title="Some customer details are hidden on the Free plan"
          description="Upgrade to see spend, order history and loyalty progress for every customer."
          collapsible={false}
          endContent={<Button label="See plans" size="sm" onClick={() => navigate('/billing')} />}
        />
      ) : null}

      <section className="stat-grid" aria-label="Customer summary">
        <StatCard label="Customers" value={formatNumber(customers.length)} isLoading={loading} />
        <StatCard label="Repeat customers" value={formatNumber(totals.repeat)} isLoading={loading} hint="More than one order" />
        <StatCard label="Lifetime spend" value={tier < 1 ? '—' : formatRand(totals.spent)} isLoading={loading} />
      </section>

      {tier >= 1 ? (
        <SegmentedControl label="Customer segment" value={segment} onChange={setSegment} size="sm">
          {SEGMENTS.map((s) => (
            <SegmentedControlItem key={s.value} value={s.value} label={`${s.label} (${segmentCounts[s.value] ?? 0})`} />
          ))}
        </SegmentedControl>
      ) : null}

      <TextInput label="Search customers" placeholder="Name, phone or email" startIcon="search" hasClear value={query} onChange={setQuery} />

      {loading ? (
        <Loading label="Loading customers" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={customers.length === 0 ? 'No customers yet' : 'No customers match'}
          description={
            customers.length === 0
              ? 'Customers appear here automatically after their first order.'
              : 'Try a different search.'
          }
        />
      ) : (
        <>
        <MobileCardList
          label="Customers"
          items={filtered.map((c) => ({
            key: c.phone_number,
            title: displayName(c),
            subtitle:
              tier < 1
                ? c.phone_number
                : [c.phone_number, `${formatNumber(c.order_count)} orders`, c.last_purchase_date ? `Last ${formatDate(c.last_purchase_date)}` : null]
                    .filter(Boolean)
                    .join(' · '),
            value: tier < 1 ? null : formatRand(c.total_spent),
            actionLabel: `Open ${displayName(c)}`,
            onClick: () => setSelected(c),
          }))}
        />
        <div className="table-wrap desktop-only">
          <Table hasHover idKey="phone_number">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Orders</TableHeaderCell>
                <TableHeaderCell>Total spent</TableHeaderCell>
                <TableHeaderCell>Last order</TableHeaderCell>
                <TableHeaderCell>
                  <VisuallyHidden>Actions</VisuallyHidden>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.phone_number}>
                  <TableCell>
                    <Text weight="medium">{displayName(c)}</Text>
                  </TableCell>
                  <TableCell>{c.phone_number}</TableCell>
                  <TableCell>{tier < 1 ? '—' : formatNumber(c.order_count)}</TableCell>
                  <TableCell>{tier < 1 ? '—' : formatRand(c.total_spent)}</TableCell>
                  <TableCell>{tier < 1 ? '—' : formatDate(c.last_purchase_date)}</TableCell>
                  <TableCell>
                    <Button label="Open" size="sm" variant="ghost" onClick={() => setSelected(c)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </>
      )}

      {selected ? (
        <CustomerDialog
          customer={selected}
          locked={tier < 1}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      ) : null}

      {broadcastOpen ? (
        <BroadcastDialog
          businessId={business.businessId}
          phones={filtered.map((c) => c.phone_number).filter(Boolean)}
          audience={tier >= 1 && segment !== 'all' ? SEGMENTS.find((s) => s.value === segment)?.label : 'all customers'}
          onClose={() => setBroadcastOpen(false)}
          onResult={setNotice}
        />
      ) : null}
    </>
  );
}

function BroadcastDialog({businessId, phones, audience, onClose, onResult}) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function send() {
    if (!message.trim()) return setError({status: 'error', title: 'Write a message first.'});
    setBusy(true);
    const res = await customerApi.sendSms(businessId, phones, message.trim());
    setBusy(false);
    if (res.ok) {
      onResult({status: 'success', title: 'Message sent', description: `Delivered to ${phones.length} customers.`});
      onClose();
    } else {
      setError({status: 'error', title: 'Could not send the message', description: res.message});
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} width={520} purpose="form">
      <DialogHeader title={`Message ${audience}`} subtitle={`${phones.length} recipients`} onOpenChange={(open) => !open && onClose()} />
      <VStack gap={4} padding={4}>
        <Notice notice={error} onDismiss={() => setError(null)} />
        <TextArea
          label="Message"
          rows={4}
          maxLength={SMS_MAX}
          value={message}
          onChange={setMessage}
          description="Tell customers about a new product, a promotion or an update."
        />
        <HStack gap={2} hAlign="end">
          <Button label="Cancel" variant="ghost" onClick={onClose} />
          <Button label="Send SMS" variant="primary" isLoading={busy} onClick={send} />
        </HStack>
      </VStack>
    </Dialog>
  );
}
