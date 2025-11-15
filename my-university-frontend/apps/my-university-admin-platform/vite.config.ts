/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 5183;
const PREVIEW_PORT = 4183;

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/my-university-admin-platform',
  plugins: [react(), nxViteTsPaths()],
  resolve: {
    alias: [
      // Специфичные алиасы для shared-ui (нужны для правильного разрешения)
      {
        find: /^@shared\/ui\/(.+)$/,
        replacement: resolve(__dirname, '../../libs/shared-ui/src/ui/$1'),
      },
      {
        find: '@shared/ui',
        replacement: resolve(__dirname, '../../libs/shared-ui/src/ui'),
      },
      {
        find: '@shared/icons',
        replacement: resolve(__dirname, '../../libs/shared-ui/src/icons'),
      },
      {
        find: /^@shared\/utils\/(.+)$/,
        replacement: resolve(__dirname, '../my-university/src/shared/utils/$1'),
      },
      {
        find: '@shared/utils',
        replacement: resolve(__dirname, '../my-university/src/shared/utils'),
      },
      // Остальные пути разрешаются через nxViteTsPaths() из tsconfig.base.json
    ],
  },
  server: {
    host: 'localhost',
    port: PORT,
  },
  preview: {
    host: 'localhost',
    port: PREVIEW_PORT,
  },
  build: {
    outDir: '../../dist/apps/my-university-admin-platform',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    reporters: 'default',
    coverage: {
      provider: 'v8' as const,
      reportsDirectory: '../../coverage/apps/my-university-admin-platform',
    },
  },
}));
