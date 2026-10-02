import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrivateResourceLinks, ResourceClaim } from "@/lib/types";

type ClaimResult = { ok: true; value: ResourceClaim } | {
  ok: false; status: number; code: string; message: string;
};
function fail(status: number, code: string, message: string): ClaimResult {
  return { ok: false, status, code, message };
}

/** All access decisions and cloud addresses stay on the server. */
export async function claimResource(id: string): Promise<ClaimResult> {
  const globalMode = process.env.RESOURCE_ACCESS_MODE || "free";
  if (globalMode === "paid") {
    return fail(402, "PAID_ACCESS_NOT_CONFIGURED", "此书暂不提供下载。");
  }
  if (globalMode !== "free") {
    return fail(503, "ACCESS_NOT_CONFIGURED", "资源领取暂未开放，请稍后再试。");
  }
  let links: PrivateResourceLinks;
  try {
    const secret = process.env.RESOURCE_LINKS_JSON;
    links = JSON.parse(secret || await readFile(join(process.cwd(), "data", "resource-links.json"), "utf8"));
  } catch (error) {
    if (!process.env.RESOURCE_LINKS_JSON && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return fail(503, "RESOURCE_NOT_READY", "此书暂不提供下载。");
    }
    return fail(503, "RESOURCE_NOT_READY", "资源暂时无法领取，请稍后再试。");
  }
  if (!links || !links.resources || typeof links.resources !== "object") {
    return fail(503, "RESOURCE_NOT_READY", "资源暂时无法领取，请稍后再试。");
  }
  const resource = Object.hasOwn(links.resources, id) ? links.resources[id] : undefined;
  if (!resource || resource.enabled === false) {
    return fail(503, "RESOURCE_NOT_READY", "此书暂不提供下载。");
  }
  if (links.access_mode === "paid" || resource.access_mode === "paid") {
    return fail(402, "PAID_ACCESS_NOT_CONFIGURED", "此书暂不提供下载。");
  }
  if ((links.access_mode && links.access_mode !== "free") ||
      (resource.access_mode && resource.access_mode !== "free")) {
    return fail(503, "ACCESS_NOT_CONFIGURED", "资源领取暂未开放，请稍后再试。");
  }
  let url: URL;
  try { url = new URL(resource.url); } catch {
    return fail(503, "RESOURCE_NOT_READY", "资源暂时无法领取，请稍后再试。");
  }
  if (url.protocol !== "https:" || !["pan.baidu.com", "yun.baidu.com"].includes(url.hostname) ||
      url.username || url.password) {
    return fail(503, "RESOURCE_NOT_READY", "资源暂时无法领取，请稍后再试。");
  }
  if (resource.expiry) {
    const expiresAt = Date.parse(resource.expiry);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return fail(410, "RESOURCE_EXPIRED", "下载链接已失效。");
    }
  }
  return { ok: true, value: {
    url: url.toString(),
    extractionCode: typeof resource.extractionCode === "string" ? resource.extractionCode : null,
    expiry: resource.expiry || null,
  } };
}
