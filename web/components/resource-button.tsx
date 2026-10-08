"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, CopyIcon, DownloadIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import type { ResourceClaim } from "@/lib/types";
import { trackResourceClaim } from "@/components/google-analytics";
import { contactHref } from "@/lib/contact";

function ResourceSupport({ id, available }: { id: string; available: boolean }) {
  return <div className="resource-support"><Link href="/help">下载帮助</Link>{available && <Link href={contactHref("broken-link", id)}>链接失效</Link>}<Link href={contactHref("book-correction", id)}>信息纠错</Link></div>;
}

export function ResourceButton({ id, resourceStatus }: {
  id: string; resourceStatus: "ready" | "preparing" | "unavailable";
}) {
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState<ResourceClaim | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  async function getResource() {
    setLoading(true); setError(""); setClaim(null); setCopied(false);
    try {
      const response = await fetch(`/api/resources/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) { setError(data.error?.message || "资源暂时无法领取，请稍后再试。"); return; }
      setClaim(data);
      trackResourceClaim(id);
    } catch { setError("暂时无法连接，请检查网络后重试。"); }
    finally { setLoading(false); }
  }
  async function copyCode() {
    if (!claim?.extractionCode) return;
    try { await navigator.clipboard.writeText(claim.extractionCode); setCopied(true); }
    catch { setError("无法自动复制，请手动复制下方提取码。"); }
  }
  if (resourceStatus !== "ready") return <div className="resource-panel"><div className="resource-title"><h2>电子书下载</h2></div><p>此书暂不提供下载。</p><ResourceSupport id={id} available={false} /></div>;
  return <div className="resource-panel">
    <div className="resource-title"><h2>获取这本书</h2><span>免费</span></div>
    <p>通过百度网盘打开原版文件，保存后即可阅读。</p>
    {claim ? <div className="claim-result" aria-live="polite">
      {claim.extractionCode && <div className="extraction-code"><span>提取码</span><strong>{claim.extractionCode}</strong><button onClick={copyCode} aria-label={copied ? "提取码已复制" : "复制提取码"}>{copied ? <CheckIcon /> : <CopyIcon />}{copied ? "已复制" : "复制"}</button></div>}
      <a className="button button-primary" href={claim.url} target="_blank" rel="noopener noreferrer">打开百度网盘 <ExternalLinkIcon aria-hidden="true" /></a>
      <button type="button" className="button button-secondary" onClick={getResource}>重新获取</button>
      {claim.expiry && <p className="resource-note">链接有效期至 {new Date(claim.expiry).toLocaleDateString("zh-CN")}</p>}
    </div> : <>
      <button className="button button-primary" onClick={getResource} disabled={loading} aria-busy={loading}>
        {loading ? <span className="button-loading-bar" aria-hidden="true" /> : <DownloadIcon aria-hidden="true" />}
        {loading ? "正在获取" : "免费获取"}
      </button>
    </>}
    {error && <p className="resource-error" role="alert">{error}</p>}
    <ResourceSupport id={id} available />
  </div>;
}
