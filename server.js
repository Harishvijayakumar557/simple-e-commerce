const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const PRODUCTS_PATH = path.join(ROOT, "data", "products.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function readProducts() {
  const raw = fs.readFileSync(PRODUCTS_PATH, "utf8");
  return JSON.parse(raw);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500);
      res.end(err.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || "/";

  if (pathname === "/api/products" && req.method === "GET") {
    try {
      sendJson(res, 200, readProducts());
    } catch {
      sendJson(res, 500, { error: "Could not load products" });
    }
    return;
  }

  if (pathname === "/api/orders" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        const order = JSON.parse(body || "{}");
        const id = `ORD-${Date.now()}`;
        const record = { id, receivedAt: new Date().toISOString(), ...order };
        const ordersDir = path.join(ROOT, "data", "orders");
        if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });
        fs.writeFileSync(path.join(ordersDir, `${id}.json`), JSON.stringify(record, null, 2), "utf8");
        sendJson(res, 201, { ok: true, orderId: id });
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body" });
      }
    });
    return;
  }

  let filePath = path.join(PUBLIC, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    sendFile(res, filePath);
  });
});

server.listen(PORT, () => {
  console.log(`Shop running at http://localhost:${PORT}`);
});
