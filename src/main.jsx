import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {LinkProvider} from '@astryxdesign/core/Link';

import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import './styles.css';

import App from './App.jsx';
import {AuthProvider} from './context/AuthContext.jsx';
import {ThemeModeProvider} from './context/ThemeModeContext.jsx';
import RouterLinkAdapter from './components/RouterLinkAdapter.jsx';

// The service worker only runs in production builds, so it never caches dev-server files.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeModeProvider>
      <BrowserRouter>
        <LinkProvider component={RouterLinkAdapter}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LinkProvider>
      </BrowserRouter>
    </ThemeModeProvider>
  </StrictMode>,
);
