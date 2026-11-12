import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

// Backends used by the Flutter mobile app. In development the browser talks to
// same-origin /api/* paths and Vite forwards them, which avoids CORS entirely.
const WHATSAPP_SERVICE = 'https://api.prod.whatsapp-service.epocketshop.store';
const SHOP_SERVICE = 'https://api.prod.epocketshop-service.epocketshop.store';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    test: {environment: 'node', include: ['src/**/*.test.js']},
    build: {
      // Pages are lazy-loaded, so the design-system code splits by usage. Only React itself is
      // pinned to a separate file so app updates don't invalidate its cache.
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/}],
          },
        },
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/api/wa': {
          target: env.WA_PROXY_TARGET || WHATSAPP_SERVICE,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/wa/, ''),
        },
        '/api/shop': {
          target: env.SHOP_PROXY_TARGET || SHOP_SERVICE,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/shop/, ''),
        },
      },
    },
  };
});
