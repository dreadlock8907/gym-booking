import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteDenoPlugin from 'vite-deno-plugin'

const port = Deno.args.includes("--port") ? parseInt(Deno.args[Deno.args.indexOf("--port") + 1]) : 3000;

export default defineConfig({
  plugins: [vue(), viteDenoPlugin()],
  server: {
    port: port
  } 
}) 