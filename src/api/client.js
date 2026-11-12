// Thin fetch wrapper around the ePocketShop backends (same ones the Flutter app uses).

const env = import.meta.env;

export const WA_API =
  env.VITE_WA_API_URL ||
  (env.DEV ? '/api/wa' : 'https://api.prod.whatsapp-service.epocketshop.store');

export const SHOP_API =
  env.VITE_SHOP_API_URL ||
  (env.DEV ? '/api/shop' : 'https://api.prod.epocketshop-service.epocketshop.store');

export const STOREFRONT_URL = env.VITE_STOREFRONT_URL || 'https://epocketshop.store';
export const ANALYTICS_URL =
  env.VITE_ANALYTICS_URL || 'https://api.prod.data-analysis-service.epocketshop.store';
export const AI_AGENT_URL =
  env.VITE_AI_AGENT_URL || 'https://api.prod.ai-service.epocketshop.store';

let tokenProvider = () => '';
let unauthorizedHandler = () => {};

export function configureClient({getToken, onUnauthorized}) {
  if (getToken) tokenProvider = getToken;
  if (onUnauthorized) unauthorizedHandler = onUnauthorized;
}

/**
 * @returns {Promise<{ok:boolean,status:number,data:any,message:string}>}
 * Never throws for HTTP errors; network failures resolve with status 0.
 */
export async function request(base, path, {method = 'POST', body, auth = false, signal} = {}) {
  const headers = {Accept: 'application/json'};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return {
      ok: false,
      status: 0,
      data: null,
      message:
        'Could not reach the server. Check your connection (or CORS settings if this is a production build).',
    };
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  const ok = res.status >= 200 && res.status < 300;
  let message = '';
  if (data && typeof data === 'object' && !Array.isArray(data) && data.message) {
    message = String(data.message);
  }
  if (!message) {
    if (ok) message = 'Success';
    else if (res.status === 503) message = 'Service unavailable. Please try again shortly.';
    else if (res.status === 401) message = 'Your session has expired. Please sign in again.';
    else message = 'Something went wrong. Please try again.';
  }

  if (res.status === 401 && auth) unauthorizedHandler();

  return {ok, status: res.status, data, message};
}

/** Fetch a binary resource (e.g. the shop QR PNG) and return an object URL, or null on failure. */
export async function fetchBlobUrl(base, path, {auth = false, accept = 'image/png'} = {}) {
  const headers = {Accept: accept};
  if (auth) {
    const token = tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(`${base}${path}`, {headers});
    if (res.status === 401 && auth) unauthorizedHandler();
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  } catch {
    return null;
  }
}

export const wa = (path, opts) => request(WA_API, path, opts);
export const shop = (path, opts) => request(SHOP_API, path, opts);
