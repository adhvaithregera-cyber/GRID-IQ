import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/GRID-IQ/' : './',
  plugins: [
    {
      name: 'copy-js-scripts',
      closeBundle() {
        const srcDir = resolve(__dirname, 'js');
        const outDir = resolve(__dirname, 'dist/js');
        mkdirSync(outDir, { recursive: true });
        readdirSync(srcDir).forEach(function(file) {
          copyFileSync(resolve(srcDir, file), resolve(outDir, file));
        });
      }
    }
  ]
});
