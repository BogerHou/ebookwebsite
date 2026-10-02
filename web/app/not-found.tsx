import Link from "next/link";
export default function NotFound() {
  return <div className="container not-found"><p className="not-found-code">404</p><h1>这页书目没有找到</h1><p>回到目录，找一本感兴趣的书继续阅读。</p><Link href="/" className="button button-primary">返回全部书籍</Link></div>;
}
