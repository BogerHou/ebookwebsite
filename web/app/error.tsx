"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="container not-found"><h1>页面暂时无法打开</h1><p>请稍后重试，或者回到书籍目录。</p><button onClick={reset} className="button button-primary">重新加载</button></div>;
}
