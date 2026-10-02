import assert from "node:assert/strict";
import { siteUrl, absoluteUrl, isPreviewDeployment } from "../lib/site.ts";

const keys = ["SITE_URL", "VERCEL_ENV", "VERCEL_PROJECT_PRODUCTION_URL"];
const originalEnvironment = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
let checked = 0;

function check(name, environment, expected) {
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, environment);
  assert.equal(isPreviewDeployment(), expected.noindex ?? false, `${name}: deployment indexing mode`);
  if (expected.error) {
    assert.throws(() => siteUrl(), expected.error, `${name}: configuration must fail early`);
  } else {
    assert.equal(siteUrl(), expected.origin, `${name}: canonical origin`);
    assert.equal(absoluteUrl("/sitemap.xml"), `${expected.origin}/sitemap.xml`, `${name}: sitemap origin`);
  }
  checked++;
}

try {
  check("local default", {}, { origin: "http://localhost:3001" });
  check("local configured port", { SITE_URL: "http://localhost:3000/" }, { origin: "http://localhost:3000" });
  check("local configured origin", { SITE_URL: "https://books.real-domain.com" }, { origin: "https://books.real-domain.com" });
  for (const target of ["production", "preview", "development"]) {
    const noindex = target !== "production";
    check(`${target}: explicit production origin`, { VERCEL_ENV: target, SITE_URL: "https://books.real-domain.com/" }, { origin: "https://books.real-domain.com", noindex });
    check(`${target}: production-domain fallback`, { VERCEL_ENV: target, VERCEL_PROJECT_PRODUCTION_URL: "shujing-books.vercel.app" }, { origin: "https://shujing-books.vercel.app", noindex });
    check(`${target}: explicit origin wins over fallback`, { VERCEL_ENV: target, SITE_URL: "https://books.real-domain.com", VERCEL_PROJECT_PRODUCTION_URL: "shujing-books.vercel.app" }, { origin: "https://books.real-domain.com", noindex });
    check(`${target}: origin required`, { VERCEL_ENV: target }, { error: /Configure SITE_URL/, noindex });
    check(`${target}: HTTPS required`, { VERCEL_ENV: target, SITE_URL: "http://books.real-domain.com" }, { error: /HTTPS/, noindex });
  }
  for (const [name, origin] of [
    ["localhost", "https://localhost:3001"],
    ["localhost subdomain", "https://books.localhost"],
    ["localhost trailing dot", "https://localhost."],
    ["IPv4 loopback", "https://127.0.0.1"],
    ["IPv4 loopback range", "https://127.255.255.254"],
    ["IPv4 shorthand loopback", "https://127.1"],
    ["IPv4 integer loopback", "https://2130706433"],
    ["IPv6 loopback", "https://[::1]"],
    ["IPv6 expanded loopback", "https://[0:0:0:0:0:0:0:1]"],
    ["IPv4 mapped IPv6 loopback", "https://[::ffff:127.0.0.1]"],
    ["unspecified address", "https://0.0.0.0"],
    ["unspecified IPv6 address", "https://[::]"],
    ["Vercel placeholder", "https://your-site.vercel.app"],
    ["example.com", "https://example.com"],
    ["example.net", "https://example.net"],
    ["example.org subdomain", "https://books.example.org"],
    ["invalid suffix", "https://books.invalid"],
    ["test suffix", "https://books.test"],
  ]) {
    check(`production rejects ${name}`, { VERCEL_ENV: "production", SITE_URL: origin }, { error: /real public production domain/ });
  }
  for (const [name, origin, error] of [
    ["nonroot path", "https://books.real-domain.com/books", /only the origin/],
    ["normalized nonroot path", "https://books.real-domain.com/books/..", /only the origin/],
    ["query", "https://books.real-domain.com/?q=books", /only the origin/],
    ["empty query", "https://books.real-domain.com?", /only the origin/],
    ["fragment", "https://books.real-domain.com/#main", /only the origin/],
    ["empty fragment", "https://books.real-domain.com#", /only the origin/],
    ["credentials", "https://user:password@books.real-domain.com", /without credentials/],
    ["unsupported scheme", "ftp://books.real-domain.com", /HTTP\(S\)/],
    ["malformed URL", "books.real-domain.com", /Invalid URL/],
  ]) {
    check(`production rejects ${name}`, { VERCEL_ENV: "production", SITE_URL: origin }, { error });
  }
  check("preview rejects bad fallback", { VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "localhost" }, { error: /real public production domain/, noindex: true });
  check("trailing slash and default HTTPS port", { VERCEL_ENV: "production", SITE_URL: "https://books.real-domain.com:443/" }, { origin: "https://books.real-domain.com" });
  check("domain containing test label is valid", { VERCEL_ENV: "production", SITE_URL: "https://test-shujing.vercel.app" }, { origin: "https://test-shujing.vercel.app" });
} finally {
  for (const key of keys) {
    if (originalEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnvironment[key];
  }
}

console.log(`Site configuration checks passed: ${checked} cases; production/preview/development, canonical fallback, local mode and bad-origin rejection.`);
