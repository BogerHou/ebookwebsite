export const SITE_NAME = "书径";
export const SITE_TITLE = "书径｜外文原版书籍中文导读与主题书单";
export const SITE_DESCRIPTION = "用中文读懂外文原版书籍。按运动训练、航海、木工、攀登与户外等主题发现好书，比较内容与适读人群，查看原书信息、精选内页和阅读建议。";

/** Canonicals always use the production origin, including on Vercel previews. */
export function isPreviewDeployment(): boolean {
  return Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");
}

export function siteUrl(): string {
  const value = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
  if (!value) {
    if (process.env.VERCEL_ENV) throw new Error("Configure SITE_URL with the public production domain before deploying.");
    return "http://localhost:3001";
  }
  const origin = value.trim();
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("SITE_URL must be an HTTP(S) origin without credentials.");
  }
  if (!/^https?:\/\/[^/?#]+\/?$/i.test(origin)) {
    throw new Error("SITE_URL must contain only the origin, without a path, query or fragment.");
  }
  if (process.env.VERCEL_ENV) {
    if (url.protocol !== "https:") {
      throw new Error("Vercel deployments require an HTTPS SITE_URL.");
    }
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
    const loopback = hostname === "localhost" || hostname.endsWith(".localhost") ||
      /^127\.\d+\.\d+\.\d+$/.test(hostname) || hostname === "::1" ||
      /^::ffff:7f[0-9a-f]{2}:[0-9a-f]+$/.test(hostname) ||
      hostname === "0.0.0.0" || hostname === "::";
    const placeholder = /(^|\.)example\.(com|net|org)$/.test(hostname) ||
      /(^|\.)(invalid|test)$/.test(hostname) ||
      hostname === "your-site.vercel.app";
    if (loopback || placeholder) {
      throw new Error("SITE_URL must use the real public production domain, not a local or example hostname.");
    }
  }
  return url.origin;
}
export function absoluteUrl(path: string): string { return new URL(path, siteUrl()).toString(); }
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
