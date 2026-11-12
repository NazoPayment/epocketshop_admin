import {useEffect, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {HStack} from '@astryxdesign/core/HStack';
import {Link} from '@astryxdesign/core/Link';
import {Selector} from '@astryxdesign/core/Selector';
import {Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';

import {FileText, Printer} from 'lucide-react';

import {useAuth} from '../context/AuthContext.jsx';
import {buildReceiptHtml, printHtml} from '../utils/print.js';

import InvoiceViewer from './InvoiceViewer.jsx';
import Loading from './Loading.jsx';
import Notice from './Notice.jsx';
import StatusBadge from './StatusBadge.jsx';
import {invoiceApi} from '../api/services.js';
import {PAYMENT_STATUSES} from '../utils/orders.js';
import {formatDate, formatRand} from '../utils/format.js';
import {deliveryLabel} from '../utils/business.js';

function Row({label, children}) {
  return (
    <HStack hAlign="between" gap={4} vAlign="start">
      <Text type="supporting">{label}</Text>
      <Text>{children}</Text>
    </HStack>
  );
}

/** Full order view: items, delivery, customer note, plus payment-status updates. */
export default function OrderDialog({order, onClose, onStatusChanged}) {
  const {business} = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [status, setStatus] = useState(order?.status || 'Unpaid');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    if (!order) return undefined;
    let cancelled = false;
    setLoading(true);
    setDetails(null);
    setNotice(null);
    setStatus(order.status || 'Unpaid');
    // The backend looks invoices up by document name (e.g. "INV-123"), not the numeric order number.
    invoiceApi.details(order.documentName).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) setDetails(res.data);
      else setNotice({status: 'error', title: 'Could not load order details', description: res.message});
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [order]);

  if (!order) return null;

  const invoice = details?.complete_invoice;
  const delivery = details?.delivery_details_info;
  const customer = details?.customer_info;
  const items = Array.isArray(invoice?.products) ? invoice.products : [];

  async function saveStatus() {
    setSaving(true);
    const res = await invoiceApi.updateStatus(order.documentName, status);
    setSaving(false);
    if (res.ok) {
      setNotice({status: 'success', title: `Marked as ${status}`});
      onStatusChanged(order.number, status);
    } else {
      setNotice({status: 'error', title: 'Could not update the status', description: res.message});
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} width={640} maxHeight="92dvh" purpose="form">
      <DialogHeader
        title={`Order #${order.number}`}
        subtitle={`${formatDate(order.date)} · ${order.phone || 'No phone'}`}
        endContent={<StatusBadge status={order.status} />}
        onOpenChange={(open) => !open && onClose()}
      />
      {viewing ? (
        <InvoiceViewer
          documentName={order.documentName}
          title={`Invoice #${order.number}`}
          onClose={() => setViewing(false)}
        />
      ) : null}
      <VStack gap={4} padding={4} className="dialog-body">
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
        {loading ? (
          <Loading label="Loading order" />
        ) : (
          <>
            {items.length > 0 ? (
              <Table density="compact" dividers="rows">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>Qty</TableHeaderCell>
                    <TableHeaderCell>Price</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p, i) => (
                    <TableRow key={`${p.name}-${i}`}>
                      <TableCell>
                        <VStack gap={0}>
                          <Text weight="medium">{p.name}</Text>
                          {p.extras ? <Text type="supporting">{p.extras}</Text> : null}
                        </VStack>
                      </TableCell>
                      <TableCell>{p.order_quantity}</TableCell>
                      <TableCell>{formatRand(p.price)}</TableCell>
                      <TableCell>{formatRand(p.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Text type="supporting">No line items were returned for this order.</Text>
            )}

            <VStack gap={2}>
              {customer?.customer_name ? <Row label="Customer">{customer.customer_name}</Row> : null}
              {delivery?.delivery_details_type ? (
                <Row label="Delivery">
                  {deliveryLabel(delivery.delivery_details_type)}
                  {delivery.delivery_details_cost ? ` · ${formatRand(delivery.delivery_details_cost)}` : ''}
                </Row>
              ) : null}
              {delivery?.delivery_details_destination ? (
                <Row label="Destination">{delivery.delivery_details_destination}</Row>
              ) : null}
              {delivery?.delivery_details_gps_url ? (
                <Row label="Map">
                  <Link href={delivery.delivery_details_gps_url} isExternalLink>
                    Open location
                  </Link>
                </Row>
              ) : null}
              {(invoice?.customer_note || order.note) ? (
                <Row label="Customer note">{invoice?.customer_note || order.note}</Row>
              ) : null}
              {invoice?.payment_terms ? <Row label="Payment terms">{invoice.payment_terms}</Row> : null}
              {invoice ? <Row label="Subtotal">{formatRand(invoice.sub_total)}</Row> : null}
              <Row label="Invoice">
                <HStack gap={2} wrap="wrap" hAlign="end">
                  <Button label="View invoice" size="sm" icon={<FileText size={14} />} onClick={() => setViewing(true)} />
                  <Button
                    label="Print"
                    size="sm"
                    variant="ghost"
                    icon={<Printer size={14} />}
                    onClick={() =>
                      printHtml(buildReceiptHtml({businessName: business.businessName, order, invoice, delivery, customer}))
                    }
                  />
                </HStack>
              </Row>
              <Divider />
              <Row label="Grand total">
                <strong>{formatRand(invoice?.grand_total ?? order.total)}</strong>
              </Row>
            </VStack>

            <Divider />
            <HStack gap={3} vAlign="end" wrap="wrap">
              <Selector
                label="Payment status"
                value={status}
                onChange={setStatus}
                options={PAYMENT_STATUSES.map((s) => ({value: s, label: s}))}
                width={220}
              />
              <Button
                label="Save status"
                variant="primary"
                isLoading={saving}
                isDisabled={status === order.status}
                onClick={saveStatus}
              />
            </HStack>
          </>
        )}
      </VStack>
    </Dialog>
  );
}
