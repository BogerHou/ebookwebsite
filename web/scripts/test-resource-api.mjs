import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
import { resolve } from "node:path";

const catalog = JSON.parse(await readFile("data/catalog.json", "utf8"));
const candidates = catalog.books.filter((book) => book.resourceStatus !== "unavailable");
assert(candidates.length >= 4, "Test requires four public books");
const [free, paid, expired, absent] = candidates;
const fixture = { access_mode: "free", resources: {
  [free.id]: { url: "https://pan.baidu.com/s/fixture-for-local-test", extractionCode: "test", access_mode: "free", expiry: "2099-01-01T00:00:00Z" },
  [paid.id]: { url: "https://pan.baidu.com/s/fixture-for-local-test", access_mode: "paid" },
  [expired.id]: { url: "https://pan.baidu.com/s/fixture-for-local-test", expiry: "2000-01-01T00:00:00Z" },
} };
async function unusedPort() {
  const server = createServer();
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const port = server.address().port;
  await new Promise((done) => server.close(done));
  return port;
}
async function withServer(mode, callback) {
  const port = await unusedPort();
  const server = spawn(process.execPath, [resolve("scripts/run-next.mjs"), "start", "--port", String(port), "--hostname", "127.0.0.1"], {
    env: { ...process.env, RESOURCE_ACCESS_MODE: mode, RESOURCE_LINKS_JSON: JSON.stringify(fixture) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  server.stdout.on("data", (chunk) => { logs += chunk.toString(); });
  server.stderr.on("data", (chunk) => { logs += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (server.exitCode !== null) throw new Error(logs);
      try { await fetch(base); ready = true; break; } catch {}
      await new Promise((done) => setTimeout(done, 250));
    }
    assert(ready, `Server did not start: ${logs}`);
    await callback(base);
  } finally {
    server.kill("SIGTERM");
    await new Promise((done) => server.once("exit", done));
  }
}
async function request(base, id, expected, suffix = "") {
  const response = await fetch(`${base}/api/resources/${id}${suffix}`);
  assert.equal(response.status, expected, `${id}: expected ${expected}`);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const data = await response.json();
  return data;
}
await withServer("free", async (base) => {
  const claim = await request(base, free.id, 200);
  assert.equal(claim.extractionCode, "test");
  assert.equal(claim.url, fixture.resources[free.id].url);
  assert.equal((await request(base, paid.id, 402, "?paid=true")).error.code, "PAID_ACCESS_NOT_CONFIGURED");
  assert.equal((await request(base, paid.id, 402, "?paid=false&access_mode=free")).error.code, "PAID_ACCESS_NOT_CONFIGURED");
  assert.equal((await request(base, expired.id, 410)).error.code, "RESOURCE_EXPIRED");
  assert.equal((await request(base, absent.id, 503)).error.code, "RESOURCE_NOT_READY");
  assert.equal((await request(base, "unknown-book", 404)).error.code, "BOOK_NOT_FOUND");
  const html = await (await fetch(`${base}/books/${free.slug}`)).text();
  assert(!html.includes(fixture.resources[free.id].url), "Private cloud link leaked into HTML");
  assert(!html.includes("/Users/"), "Local path leaked into HTML");
});
await withServer("paid", async (base) => {
  assert.equal((await request(base, free.id, 402, "?paid=true&access_mode=free")).error.code, "PAID_ACCESS_NOT_CONFIGURED");
});
console.log("Resource API checks passed: free, paid, expired, missing, unknown, client query bypass prevention, no-store and HTML privacy.");
