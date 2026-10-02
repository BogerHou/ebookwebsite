import Link from "next/link";

export function Footer() {
  return <footer className="site-footer">
    <div className="container footer-inner">
      <div><Link href="/" className="footer-brand">书径</Link><p>从一本书开始，走进一个领域。</p></div>
      <nav className="footer-links" aria-label="页脚导航"><Link href="/categories">主题分类</Link><Link href="/guides">选书指南</Link><Link href="/about">关于书径</Link><Link href="/help">下载帮助</Link><Link href="/contact">联系与反馈</Link><Link href="/privacy">隐私说明</Link></nav>
    </div>
  </footer>;
}
