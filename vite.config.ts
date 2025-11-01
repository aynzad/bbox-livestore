/* eslint-disable unicorn/no-process-exit */
import { spawn } from 'node:child_process'
import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 60_001,
  },
  worker: { format: 'es' },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
    livestoreDevtoolsPlugin({
      schemaPath: [
        './src/store/projects/projects.schema.ts',
        './src/store/project/project.schema.ts',
      ],
    }),
    {
      name: 'wrangler-dev',
      configureServer: async (server) => {
        const wrangler = spawn(
          './node_modules/.bin/wrangler',
          ['dev', '--port', '8788'],
          {
            stdio: ['ignore', 'inherit', 'inherit'],
          },
        )

        const shutdown = () => {
          if (wrangler.killed === false) {
            wrangler.kill()
          }
          process.exit(0)
        }

        server.httpServer?.on('close', shutdown)
        process.on('SIGTERM', shutdown)
        process.on('SIGINT', shutdown)

        wrangler.on('exit', (code) =>
          console.error(`wrangler dev exited with code ${code}`),
        )
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
