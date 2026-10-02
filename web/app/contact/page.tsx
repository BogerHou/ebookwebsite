import type { Metadata } from "next";
import Link from "next/link";
import { ContactComposer } from "@/components/contact-composer";
import { getBookById } from "@/lib/catalog";
import { getContactTopic } from "@/lib/contact";
import { absoluteUrl } from "@/lib/site";

const title = "联系与反馈";
const description = "向书径反馈电子书链接失效、文件下载问题或书籍信息错误，帮助更多读者找到合适的书。";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/contact" },
  openGraph: { title, description, url: "/contact", images: [{ url: "/opengraph-image" }] },
};

export default async function ContactPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const book = typeof query.book === "string" ? getBookById(query.book) : undefined;
  const topic = getContactTopic(typeof query.topic === "string" ? query.topic : undefined);
  const context = book ? { title: book.title, originalTitle: book.originalTitle, url: absoluteUrl(`/books/${book.slug}`) } : undefined;

  return <div className="container about-page support-page">
    <div className="page-introduction">
      <h1>联系与反馈</h1>
      <p>链接打不开、文件有问题，或书籍信息需要更正，都可以通过邮件告诉我们。</p>
    </div>
    <ContactComposer key={`${book?.id || "general"}-${topic}`} initialTopic={topic} book={context} />
    <div className="contact-reading-links">
      <p>领取与阅读步骤可先查看<Link href="/help">下载帮助</Link>。</p>
      <p>反馈邮件中的信息处理方式见<Link href="/privacy">隐私说明</Link>。</p>
    </div>
  </div>;
}
