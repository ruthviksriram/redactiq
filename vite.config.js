import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Custom Vite plugin to inject Content-Security-Policy meta tag only during production build.
 * Development server remains free of CSP restrictions for HMR.
 */
const cspPlugin = () => ({
  name: 'html-csp-transform',
  apply: 'build',
  transformIndexHtml(html) {
    const cspMeta =
      "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; connect-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:;\">";
    return html.replace('</head>', `  ${cspMeta}\n  </head>`);
  },
});

export default defineConfig({
  plugins: [react(), cspPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.js'],
      exclude: ['src/lib/__tests__/**', 'src/lib/useEffects3D.js'],
    },
  },
});
