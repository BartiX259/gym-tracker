import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte(),
    {
      name: 'auto-version-sw',
      closeBundle() {
        const swPath = 'dist/sw.js';
        if (fs.existsSync(swPath)) {
          let content = fs.readFileSync(swPath, 'utf-8');
          // Replace the CACHE_NAME with a unique build timestamp
          content = content.replace(
            /const CACHE_NAME = ['"].*?['"]/,
            `const CACHE_NAME = 'gym-tracker-${Date.now()}'`
          );
          fs.writeFileSync(swPath, content);
        }
      }
    }
  ],
})
