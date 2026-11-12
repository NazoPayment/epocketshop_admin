import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {authApi, businessApi} from '../api/services.js';
import {configureClient} from '../api/client.js';

const STORAGE_KEY = 'epocketshop_admin.session.v1';

const AuthContext = createContext(null);

/** Mirrors BusinessDetails.fromJson in the Flutter app. */
export function normalizeBusiness(raw = {}) {
  const rawVerified = String(raw.verified ?? 'false');
  let verificationLevel = 'false';
  if (rawVerified === 'true') verificationLevel = 'merchant';
  else if (rawVerified === 'merchant' || rawVerified === 'business') verificationLevel = rawVerified;

  const truthy = (v) => v === true || String(v) === 'true';

  return {
    ...raw,
    businessId: raw.business_id,
    vendorId: raw.vendor_id,
    businessName: raw.business_name || '',
    orderPhrase: raw.order_phrase || '',
    logoUrl: raw.logo_url || '',
    description: raw.description || '',
    currency: raw.currency || 'ZAR',
    address: raw.address || '',
    coordinates: raw.coordinates || '',
    subscription: Number(raw.subscription ?? 0),
    verificationLevel,
    verificationStatus: String(raw.verification_status ?? 'not_submitted'),
    paymentMethod: raw.payment_method || 'online',
    invoiceFormat: truthy(raw.invoice_format),
    trackInventory: truthy(raw.track_inventory),
    deliveryOptions: Array.isArray(raw.delivery_method) ? raw.delivery_method : [],
    social: {
      facebook: raw.social_media?.facebook || '',
      instagram: raw.social_media?.instagram || '',
      twitter: raw.social_media?.twitter || '',
    },
    billing: raw.billing || {},
  };
}

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.business) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({children}) {
  const [session, setSession] = useState(readSession);
  const tokenRef = useRef(session?.accessToken || '');
  tokenRef.current = session?.accessToken || '';

  const persist = useCallback((next) => {
    setSession(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => persist(null), [persist]);

  useEffect(() => {
    configureClient({getToken: () => tokenRef.current, onUnauthorized: logout});
  }, [logout]);

  const login = useCallback(
    async (phone, password) => {
      const res = await authApi.login(phone, password);
      if (!res.ok) return res;
      const body = res.data || {};
      persist({
        accessToken: body.access_token || '',
        refreshToken: body.refresh_token || '',
        business: body.business_details || {},
        vendor: body.vendor || {},
      });
      return res;
    },
    [persist],
  );

  const refreshBusiness = useCallback(async () => {
    const current = readSession();
    const id = current?.business?.business_id;
    if (!id) return null;
    const res = await businessApi.get(id);
    if (res.ok && res.data) {
      const fresh = res.data.business_details || res.data;
      const next = {...current, business: {...current.business, ...fresh}};
      persist(next);
      return res;
    }
    return res;
  }, [persist]);

  const patchBusiness = useCallback(
    (patch) => {
      const current = readSession();
      if (!current) return;
      persist({...current, business: {...current.business, ...patch}});
    },
    [persist],
  );

  const patchVendor = useCallback(
    (patch) => {
      const current = readSession();
      if (!current) return;
      persist({...current, vendor: {...current.vendor, ...patch}});
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.accessToken),
      accessToken: session?.accessToken || '',
      business: session ? normalizeBusiness(session.business) : null,
      vendor: session?.vendor || null,
      login,
      logout,
      refreshBusiness,
      patchBusiness,
      patchVendor,
    }),
    [session, login, logout, refreshBusiness, patchBusiness, patchVendor],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
