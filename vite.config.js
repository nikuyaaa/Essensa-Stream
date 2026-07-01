import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

let globalState = {};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'local-state-sync',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const urlPath = req.url.split('?')[0];
          if (urlPath === '/api/state') {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  globalState = JSON.parse(body);
                  res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type'
                  });
                  res.end(JSON.stringify({ success: true }));
                } catch (e) {
                  res.writeHead(400);
                  res.end('Invalid JSON');
                }
              });
            } else if (req.method === 'GET') {
              res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
              });
              res.end(JSON.stringify(globalState));
            } else if (req.method === 'OPTIONS') {
              res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              });
              res.end();
            }
          } else {
            next();
          }
        });
      }
    }
  ],
})

