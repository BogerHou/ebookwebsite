import { NextResponse } from "next/server";
import { getBookById } from "@/lib/catalog";
import { claimResource } from "@/lib/resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-z0-9][a-z0-9_-]{0,120}$/i.test(id) || !getBookById(id)) {
    return NextResponse.json({ error: { code: "BOOK_NOT_FOUND", message: "没有找到这本书。" } }, { status: 404, headers });
  }
  if (getBookById(id)?.resourceStatus === "unavailable") {
    return NextResponse.json({ error: { code: "RESOURCE_UNAVAILABLE", message: "这本书暂时没有可领取的资源。" } }, { status: 503, headers });
  }
  const result = await claimResource(id);
  if (!result.ok) return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status, headers });
  return NextResponse.json(result.value, { headers });
}
