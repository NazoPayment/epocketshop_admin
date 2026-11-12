import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';

import {useAuth} from './AuthContext.jsx';
import {invoiceApi, productApi} from '../api/services.js';
import {parseInvoices} from '../utils/orders.js';
import {buildAlerts} from '../utils/alerts.js';

const POLL_MS = 60_000;
const seenKey = (businessId) => `epocketshop_admin.seen_orders.${businessId}`;

const AlertsContext = createContext(null);

function readSeen(businessId) {
  try {
    const raw = localStorage.getItem(seenKey(businessId));
    return raw ? new Set(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeSeen(businessId, set) {
  try {
    // Keep the list bounded so storage doesn't grow forever.
    localStorage.setItem(seenKey(businessId), JSON.stringify([...set].slice(-500)));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Polls orders and products and exposes alerts (new orders, stale unpaid, low stock). */
export function AlertsProvider({children}) {
  const {business} = useAuth();
  const businessId = business?.businessId;
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [seen, setSeen] = useState(() => readSeen(businessId) || new Set());
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const firstLoad = useRef(true);
  const seenRef = useRef(seen);
  seenRef.current = seen;

  const refresh = useCallback(async () => {
    if (!businessId) return;
    const [inv, prod] = await Promise.all([
      invoiceApi.list(businessId, 'this_week'),
      productApi.list(business.businessName),
    ]);
    const list = inv.ok ? parseInvoices(inv.data) : null;
    if (prod.ok) setProducts(Array.isArray(prod.data?.products) ? prod.data.products : []);
    if (!list) return;
    setInvoices(list);

    // First ever load on this browser: treat existing orders as already seen so we don't flood.
    if (firstLoad.current && !readSeen(businessId)) {
      const initial = new Set(list.map((o) => o.number));
      setSeen(initial);
      writeSeen(businessId, initial);
    } else if (!firstLoad.current && permission === 'granted') {
      const fresh = list.filter((o) => !seenRef.current.has(o.number));
      if (fresh.length && document.visibilityState !== 'visible') {
        // eslint-disable-next-line no-new
        new Notification(`${business.businessName}: ${fresh.length} new ${fresh.length === 1 ? 'order' : 'orders'}`, {
          body: `Order #${fresh[0].number}`,
          tag: 'new-orders',
        });
      }
    }
    firstLoad.current = false;
  }, [businessId, business?.businessName, permission]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const alerts = useMemo(() => buildAlerts({invoices, products, seenOrders: seen}), [invoices, products, seen]);

  const markOrdersSeen = useCallback(() => {
    const next = new Set([...seenRef.current, ...invoices.map((o) => o.number)]);
    setSeen(next);
    writeSeen(businessId, next);
  }, [invoices, businessId]);

  const enableDesktopAlerts = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    setPermission(await Notification.requestPermission());
  }, []);

  const value = useMemo(
    () => ({alerts, products, invoices, markOrdersSeen, refresh, permission, enableDesktopAlerts}),
    [alerts, products, invoices, markOrdersSeen, refresh, permission, enableDesktopAlerts],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used inside <AlertsProvider>');
  return ctx;
}
