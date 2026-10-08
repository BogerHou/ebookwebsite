import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function Header() {
  return <header className="site-header">
    <div className="container header-inner">
      <Link className="brand" href="/" aria-label="书径首页">
        <span className="brand-mark"><BrandMark /></span>
        <span>书径</span>
      </Link>
      <span className="brand-description">用中文，认识原版好书</span>
      <nav aria-label="主要导航">
        <Link href="/">全部书籍</Link>
        <Link href="/categories">主题分类</Link>
        <Link href="/guides">选书指南</Link>
        <Link href="/about">关于书径</Link>
      </nav>
    </div>
  </header>;
}
