import {useCallback, useSyncExternalStore} from 'react';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const detectIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  // iPadOS reports itself as a Mac; touch support gives it away.
  (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

/*
 * The browser fires `beforeinstallprompt` once, shortly after load. It must be captured at
 * startup (this module is imported from main.jsx), otherwise lazily loaded screens miss it.
 */
let state = {deferred: null, installed: typeof window !== 'undefined' && isStandalone()};
const listeners = new Set();

function setState(next) {
  state = {...state, ...next};
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setState({deferred: e});
  });
  window.addEventListener('appinstalled', () => setState({installed: true, deferred: null}));
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

/**
 * "Install app" support. Chrome/Edge/Android expose a prompt we can trigger;
 * iOS Safari has no prompt, so we report `isIos` and the UI shows the manual steps.
 */
export function useInstallPrompt() {
  const {deferred, installed} = useSyncExternalStore(subscribe, getSnapshot);

  const install = useCallback(async () => {
    if (!state.deferred) return;
    const prompt = state.deferred;
    prompt.prompt();
    const choice = await prompt.userChoice;
    setState({deferred: null, installed: choice?.outcome === 'accepted' || state.installed});
  }, []);

  return {canInstall: Boolean(deferred), installed, isIos: detectIos(), install};
}
