import Link from "next/link";

export function Footer() {
  return <footer className="site-footer">
    <div className="container footer-inner">
      <div><Link href="/" className="footer-brand">书径</Link><p>从一本书开始，走进一个领域。</p></div>
      <div className="footer-links"><Link href="/categories">主题分类</Link><Link href="/guides">选书指南</Link><Link href="/about">关于书径</Link></div>
    </div>
  </footer>;
}
