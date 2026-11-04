import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);
  const distPath = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'MGA Quality Sentinel Dashboard',
      timestamp: new Date().toISOString()
    });
  });

  if (hasDist) {
    // Production mode: Serve built static bundle
    app.use(express.static(distPath));
    app.use(express.static(path.join(__dirname, 'public')));

    // SPA client-side fallback
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development mode fallback: use Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MGA Quality Sentinel running on port ${port} (mode: ${hasDist ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
