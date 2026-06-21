import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages serves a project site under /<repo>/, so production assets must be
// requested from that sub-path. Dev (`vite`) stays at "/" so local + Tailscale
// viewing is unaffected; only `vite build` (the Pages artifact) gets the prefix.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/metric-dashboard/' : '/',
  plugins: [react()],
}))
