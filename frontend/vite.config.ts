import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Web NFC (NDEFReader) solo funciona en un "secure context": HTTPS o localhost.
// Al abrir la app desde el móvil por la IP de la red local (http://192.168.x.x)
// NO sería seguro y el escaneo NFC no estaría disponible, así que para la demo
// en el teléfono se arranca con `npm run movil`, que sirve por HTTPS con un
// certificado autofirmado (el móvil avisa de "conexión no privada" la primera
// vez: hay que aceptar y continuar).
//
// En el portátil `npm run dev` sigue en HTTP sobre localhost, que también es un
// secure context y evita tener que aceptar el certificado en cada navegador.
//
// La API se sirve por proxy bajo /api en el MISMO origen. Si el frontend fuera
// HTTPS y llamara directamente a http://...:8000, el navegador bloquearía las
// peticiones por contenido mixto; con el proxy solo hay un certificado que
// aceptar y además desaparece el problema de CORS en el móvil.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'movil' ? [basicSsl()] : [])],
  server: {
    port: 5173,
    host: true, // expone el servidor en la red local para probar desde el móvil
    // Vite rechaza por defecto las peticiones cuyo Host no reconoce. Al publicar
    // la demo por un túnel de Cloudflare el Host es *.trycloudflare.com, así que
    // hay que permitirlo explícitamente o devuelve "Blocked request".
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}))
