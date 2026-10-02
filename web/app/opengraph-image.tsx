import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getCatalog } from "@/lib/catalog";

export const alt = "书径：外文原版书籍与中文阅读导读，展示馆藏原书封面";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const dynamic = "force-static";

export default async function Image() {
  const catalog = getCatalog();
  const selected = catalog.books.filter((book) => book.featured && book.cover.src.endsWith("-cover.webp")).slice(0, 4);
  const covers = await Promise.all(selected.map(async (book) => {
    const image = await readFile(join(process.cwd(), "public", book.cover.src));
    const png = await sharp(image).resize({ width: 184, height: 250, fit: "inside" }).png().toBuffer();
    return { id: book.id, src: `data:image/png;base64,${png.toString("base64")}` };
  }));
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#f4f6f5", color: "#234e3a", padding: "48px 64px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, letterSpacing: 4 }}><span>SHUJING</span><span style={{ fontSize: 16, letterSpacing: 1 }}>{catalog.books.length} BOOKS / {catalog.categories.length} THEMES</span></div>
    <div style={{ display: "flex", marginTop: 24, fontSize: 44, lineHeight: 1.2 }}>Original books. Chinese reading guides.</div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 36, marginTop: 32, padding: "22px 36px", background: "#ffffff", height: 300 }}>
      {covers.map((cover) => <img key={cover.id} src={cover.src} alt="Original book cover" width={184} height={250} style={{ objectFit: "contain" }} />)}
    </div>
    <div style={{ display: "flex", marginTop: 24, fontSize: 18, color: "#637169" }}>SPORTS · SAILING · WOODWORKING · OUTDOORS</div>
  </div>, size);
}
