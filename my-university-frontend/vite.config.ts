import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': resolve(rootDir, 'src/app'),
      '@shared': resolve(rootDir, 'src/shared'),
      '@entities': resolve(rootDir, 'src/entities'),
      '@features': resolve(rootDir, 'src/features'),
      '@widgets': resolve(rootDir, 'src/widgets'),
      '@processes': resolve(rootDir, 'src/processes'),
    },
    dedupe: ['react', 'react-dom'],
  },
});
