import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// No GitHub Pages o app fica em /<nome-do-repositorio>/ (definido pelo workflow de deploy).
const base = process.env.BASE_PATH ?? '/'

/**
 * Content Security Policy (docs/arquitetura.md, seção 3): o app só pode falar com o Google.
 * Aplicada apenas no build, porque o servidor de desenvolvimento do Vite usa scripts inline.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com/gsi/client",
  "connect-src 'self' https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com",
  'frame-src https://accounts.google.com',
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' data:",
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function politicaDeSeguranca(): Plugin {
  return {
    name: 'facilita-psi-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    ],
  }
}

export default defineConfig({
  base,
  plugins: [
    react(),
    politicaDeSeguranca(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Facilita Psi',
        short_name: 'Facilita Psi',
        description: 'Agenda, presença e prontuário para a clínica de psicologia.',
        lang: 'pt-BR',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'any',
        background_color: '#faf8f7',
        theme_color: '#3e6a99',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Guarda só os arquivos do próprio app para funcionar offline.
      // As chamadas ao Google não entram no cache: sempre vão para a rede.
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,txt}'],
      },
    }),
  ],
})
