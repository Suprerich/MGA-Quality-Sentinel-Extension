import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || "3000", 10);
  const distPath = path.join(__dirname, "dist");
  const hasDist = fs.existsSync(distPath);
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "MGA Quality Sentinel Dashboard",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/retail-scrape", async (req, res) => {
    const platform = String(req.query.platform || "target");
    const keyword = String(req.query.keyword || "").trim();
    if (!keyword) {
      return res.status(400).json({ success: false, error: "Keyword required" });
    }
    return res.json({
      success: false,
      error: `Web\u7AEF\u65E0\u6CD5\u76F4\u63A5\u8DE8\u57DF\u7A7F\u900F\u96F6\u552E\u5546\u7684\u53CD\u722C\u866B\u7B56\u7565\u3002\u8BF7\u70B9\u51FB\u53F3\u4E0A\u89D2\u201CInstall Extension\u201D\u5728 Chrome \u6216 Microsoft Edge \u4E2D\u52A0\u8F7D\u63D2\u4EF6\uFF0C\u5728\u771F\u5B9E\u6D4F\u89C8\u5668\u4F1A\u8BDD\u4E2D\u6267\u884C\u539F\u751F\u6293\u53D6\uFF0C\u6216\u4F7F\u7528\u6269\u5C55\u4FA7\u8FB9\u680F\u7684\u201CScan Current Page\u201D\u76F4\u63A5\u6293\u53D6\u5546\u54C1\u9875\u3002`
    });
  });
  app.get(["/api/download-extension", "/mga-sentinel-extension.zip"], (_req, res) => {
    const candidates = [
      path.join(__dirname, "dist", "mga-sentinel-extension.zip"),
      path.join(__dirname, "public", "mga-sentinel-extension.zip")
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", 'attachment; filename="MGA_Quality_Sentinel_Extension_v1.4.3.zip"');
        return res.sendFile(p);
      }
    }
    res.status(404).json({ error: "Extension zip package not found. Run npm run build first." });
  });
  if (hasDist) {
    app.use(express.static(distPath));
    app.use(express.static(path.join(__dirname, "public")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`MGA Quality Sentinel running on port ${port} (mode: ${hasDist ? "production" : "development"})`);
  });
}
startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
