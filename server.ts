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

  // Server-side Retail Scrape Proxy for Web Mode (Strictly no fake fallback data)
  app.get('/api/retail-scrape', async (req, res) => {
    const platform = String(req.query.platform || 'target');
    const keyword = String(req.query.keyword || '').trim();

    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Keyword required' });
    }

    // Direct proxy informs user clearly when retailer anti-bot blocks cloud requests
    return res.json({
      success: false,
      error: `Web端无法直接跨域穿透零售商的反爬虫策略。请点击右上角“Install Extension”在 Chrome 或 Microsoft Edge 中加载插件，在真实浏览器会话中执行原生抓取，或使用扩展侧边栏的“Scan Current Page”直接抓取商品页。`
    });
  });

  // Direct Extension Zip Download Route
  app.get(['/api/download-extension', '/mga-sentinel-extension.zip'], (_req, res) => {
    const candidates = [
      path.join(__dirname, 'dist', 'mga-sentinel-extension.zip'),
      path.join(__dirname, 'public', 'mga-sentinel-extension.zip'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="MGA_Quality_Sentinel_Extension_v1.4.3.zip"');
        return res.sendFile(p);
      }
    }
    res.status(404).json({ error: 'Extension zip package not found. Run npm run build first.' });
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
