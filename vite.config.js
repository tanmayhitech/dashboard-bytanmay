import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { pathToFileURL } from 'url'

// Localhost Vite Dev Server middleware for /api/* endpoints
function apiPlugin() {
  return {
    name: 'vercel-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const endpoint = req.url.split('?')[0].replace('/api/', '');
          try {
            const filePath = path.resolve(process.cwd(), 'api', `${endpoint}.js`);
            const fileUrl = pathToFileURL(filePath).href + `?update=${Date.now()}`;
            const apiModule = await import(fileUrl);
            if (apiModule && typeof apiModule.default === 'function') {
              let body = {};
              if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                const buffers = [];
                for await (const chunk of req) {
                  buffers.push(chunk);
                }
                const rawBody = Buffer.concat(buffers).toString();
                try {
                  body = JSON.parse(rawBody || '{}');
                } catch {
                  body = {};
                }
              }
              req.body = body;

              res.status = (code) => {
                res.statusCode = code;
                return res;
              };
              res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              };

              return apiModule.default(req, res);
            }
          } catch (err) {
            console.error(`[Vite API Middleware] Error executing /api/${endpoint}:`, err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiPlugin()],
    server: {
      port: 5173,
      host: true
    }
  };
});
