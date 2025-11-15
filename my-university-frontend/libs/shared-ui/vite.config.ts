/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/shared-ui',
  plugins: [react(), nxViteTsPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    reporters: 'default',
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/libs/shared-ui'
    }
  }
});
