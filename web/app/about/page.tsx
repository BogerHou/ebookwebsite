import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "关于书径", description: "用中文了解外文原版书，按兴趣寻找运动、航海、手作与亲子等主题读物，比较选书方向并获取阅读资源。", alternates: { canonical: "/about" } };
export default function About() {
  return <div className="container about-page"><div className="page-introduction"><h1>从兴趣出发，发现外文原版书</h1><p>用中文了解一本书，找到适合自己的阅读方向。</p></div>
    <div className="about-prose">
      <p>书径收录运动、航海、攀登、工程手作、摄影与亲子等主题的外文读物。从游泳动作到帆船物理，从木工夹具到自然观察，你可以围绕一个感兴趣的问题开始阅读。</p>
      <h2>按主题找书</h2>
      <p>在<Link href="/">书籍目录</Link>搜索中文书名、原文题名、作者或关键词，也可以从<Link href="/categories">主题分类</Link>浏览相关读物。想比较同类书籍时，先读一篇<Link href="/guides">选书指南</Link>，了解它们的侧重点与阅读顺序。</p>
      <h2>先了解，再阅读</h2>
      <p>书籍页提供中文介绍、适读人群、内容要点与原文题名。部分书籍还可以预览内页，帮助你判断图文形式与英文难度。阅读前请留意原书语言与PDF页数；中文介绍不代表下载文件包含中文译文。</p>
      <h2>获取阅读资源</h2>
      <p>有可用资源的书籍，可在书籍页点击“免费获取”，查看百度网盘链接与提取码。打开链接后保存或下载PDF，即可在支持PDF的阅读器中阅读。</p>
      <Link className="button button-primary" href="/">浏览书籍</Link>
    </div>
  </div>;
}
