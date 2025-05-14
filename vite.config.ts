import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.' // dist/로 복사
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, 'src/extension/background.ts'),
        content: path.resolve(__dirname, 'src/extension/content.ts')
      },
      output: {
        entryFileNames: '[name].js'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
})
