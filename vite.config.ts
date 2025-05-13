import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ outDir: 'dist', insertTypesEntry: true })],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      name: 'debugbuddy-sdk',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom']
    }
  }
})
