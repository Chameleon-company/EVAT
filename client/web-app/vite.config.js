import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(() => {
  const env = {
    parsed: {
      // Load root .env
      ...(dotenv.config({
        path: path.resolve(__dirname, '../../.env'),
      }).parsed || {}),
      // Load workspace-specific .env, overriding duplicates
      ...(dotenv.config({
        path: path.resolve(__dirname, './.env'),
      }).parsed || {}),
    },
  }
  expand(env);

  // Map thee to Vite's `define` so they are accessible via import.meta.env.*
  const processEnv = {};
  for (const key in env.parsed) {
    if (key.startsWith('VITE_')) {
      processEnv[`import.meta.env.${key}`] = JSON.stringify(env.parsed[key]);
    }
  }
  
  return {
    define: processEnv,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    root: process.cwd(),
    server: { port: 3000 },
  };
})
