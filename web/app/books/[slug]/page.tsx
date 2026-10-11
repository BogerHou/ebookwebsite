import type { Metadata } from "next";
import Image from "@/components/book-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { BookCard } from "@/components/book-card";
import { ResourceButton } from "@/components/resource-button";
import { getBook, getBookById, getBooks, getCategory, getRelatedBooks } from "@/lib/catalog";
import { absoluteUrl, jsonLd } from "@/lib/site";
import { bookImageAlt } from "@/lib/book-images";
import { getBookReadingNote, getGuidesForBook } from "@/lib/editorial";
import { getBookBibliography, getBookDescription, getBookDetail } from "@/lib/book-details";
import { getBookFileInfo, getBookFileSize, getBookTextSearchLabel } from "@/lib/book-file-info";
import { bookLanguageCode } from "@/lib/book-language";
import { GuideLink } from "@/components/guide-link";
import type { Book } from "@/lib/types";

export const dynamicParams = false;
export function generateStaticParams() { return getBooks().map((book) => ({ slug: book.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const book = getBook((await params).slug);
  if (!book) return {};
  const description = getBookDescription(book, getBookDetail(book.id));
  const title = `${book.title}｜内容介绍、目录与原版电子书 · 书径`;
  return {
    title: { absolute: title }, description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: { title, description, url: `/books/${book.slug}`, images: [{ url: book.cover.src, width: book.cover.width, height: book.cover.height, alt: book.title }] },
    twitter: { card: "summary_large_image", title, description, images: [book.cover.src] },
  };
}
export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const book = getBook((await params).slug);
  if (!book) notFound();
  const category = getCategory(book.categorySlug);
  const detail = getBookDetail(book.id);
  const bibliography = getBookBibliography(book, detail);
  const fileInfo = getBookFileInfo(book.id);
  const fileSize = getBookFileSize(book, fileInfo);
  const pdfPages = fileInfo?.pageCount ?? book.pages;
  const contributorHeading = book.authorRole === "editor" ? "编者简介" : "作者简介";
  const readingNote = getBookReadingNote(book.id);
  const readingGuides = getGuidesForBook(book.id);
  const comparisons = (detail?.comparisons || []).flatMap((item) => {
    const other = getBookById(item.bookId);
    return other && other.id !== book.id ? [{ book: other, reason: item.reason }] : [];
  });
  const related = [...(readingNote?.relatedBookIds || []).map(getBookById).filter((other): other is Book => Boolean(other)), ...comparisons.map((item) => item.book), ...getRelatedBooks(book)]
    .filter((other, index, all) => other.id !== book.id && all.findIndex((item) => item.id === other.id) === index).slice(0, 4);
  const authors = book.authors.flatMap((raw, index) => raw.split(";").map((value) => {
    const name = value.trim();
    return { "@type": book.authorTypes?.[index] || (/National Geographic|Partners LLC|Association|Federation|University|Office of Naval|Department|Publishing|^DK$|^NSCA|^VDiff|Special Tactics|Charles River Editors/i.test(name) ? "Organization" : "Person"), name };
  }).filter((author) => author.name));
  const editors = (book.editors || []).map((name) => ({ "@type": "Person", name }));
  const workSchema = {
    "@context": "https://schema.org",
    "@type": book.resourceKind === "magazine" ? "PublicationIssue" : "Book",
    name: book.title, alternateName: book.originalTitle,
    ...(book.authorRole !== "editor" && authors.length ? { author: authors } : {}),
    ...((book.authorRole === "editor" ? authors.length > 0 : editors.length > 0) ? { editor: book.authorRole === "editor" ? [...authors, ...editors] : editors } : {}),
    inLanguage: bookLanguageCode(book),
    ...(book.resourceKind === "magazine" ? {
      encodingFormat: "application/pdf",
      isPartOf: { "@type": "Periodical", name: book.periodicalTitle },
    } : {
      bookFormat: "https://schema.org/EBook",
      ...(book.pages ? { numberOfPages: book.pages } : {}),
      ...(bibliography.isbn ? { isbn: bibliography.isbn } : {}),
      ...(bibliography.edition ? { bookEdition: bibliography.edition } : {}),
    }),
    ...(bibliography.year && /^\d{4}$/.test(bibliography.year) ? { datePublished: bibliography.year } : {}),
    ...(bibliography.publisher ? { publisher: { "@type": "Organization", name: bibliography.publisher } } : {}),
    image: absoluteUrl(book.cover.src), description: getBookDescription(book, detail), url: absoluteUrl(`/books/${book.slug}`),
  };
  const breadcrumbs = [{ name: "全部书籍", path: "/" }, ...(category ? [{ name: category.title, path: `/categories/${category.slug}` }] : []), { name: book.title, path: `/books/${book.slug}` }];
  const sections = [
    { id: "introduction", title: "内容介绍" },
    ...(detail?.contents?.items.length ? [{ id: "contents", title: detail.contents.label }] : []),
    { id: "highlights", title: "核心主题" },
    ...(detail?.authorProfiles?.length ? [{ id: "authors", title: contributorHeading }] : []),
    { id: "audience", title: "适合谁读" },
    ...(detail || readingNote ? [{ id: "reading-tips", title: "阅读建议" }] : []),
    ...(comparisons.length ? [{ id: "book-comparisons", title: "同类书怎么选" }] : []),
    ...(detail?.questions.length ? [{ id: "reading-questions", title: "阅读问答" }] : []),
    ...(book.previews.length ? [{ id: "previews", title: "精选内页" }] : []),
    ...(readingGuides.length ? [{ id: "reading-guides", title: "选书指南" }] : []),
    ...(detail?.sources?.length ? [{ id: "book-references", title: "相关资料" }] : []),
  ];
  return <div className="container book-detail-page">
    <nav aria-label="面包屑" className="breadcrumbs"><Link href="/">全部书籍</Link><ChevronRightIcon aria-hidden="true" />
      {category && <><Link href={`/categories/${category.slug}`}>{category.title}</Link><ChevronRightIcon aria-hidden="true" /></>}<span>{book.title}</span>
    </nav>
    <article>
      <div className="detail-top">
        <div className="detail-cover-column"><div className="detail-cover"><Image src={book.cover.src} width={book.cover.width} height={book.cover.height} alt={bookImageAlt(book)} preload sizes="(max-width: 767px) min(294px, calc(100vw - 82px)), 290px" /></div></div>
        <div className="detail-book-info">
          <p className="detail-subcategory">{book.subcategory || category?.title}</p>
          <h1>{book.title}</h1><p className="detail-original-title">{book.originalTitle}</p>
          {book.authors.length > 0 && <p className="detail-authors">{book.authorRole === "editor" && "主编："}{detail?.authorProfiles?.length ? <a href="#authors">{book.authors.join(" / ")}</a> : book.authors.join(" / ")}</p>}
          {book.editors?.length ? <p className="detail-authors">编者：{book.editors.join(" / ")}</p> : null}
          <dl className="book-basic-fields">
            {bibliography.publisher && <div><dt>出版社</dt><dd>{bibliography.publisher}</dd></div>}
            {bibliography.year && <div><dt>出版年份</dt><dd>{bibliography.year}</dd></div>}
            {bibliography.edition && <div><dt>版本</dt><dd>{bibliography.edition}</dd></div>}
            {bibliography.isbn && <div><dt>ISBN</dt><dd>{bibliography.isbn}</dd></div>}
            {bibliography.printPages && <div><dt>原书页数</dt><dd>{bibliography.printPages} 页</dd></div>}
          </dl>
          <p className="detail-summary">{book.summary}</p>
          <section className="book-file-information" aria-labelledby="book-file-information-heading">
            <h2 id="book-file-information-heading">文件信息</h2>
            <dl className="book-basic-fields">
              <div><dt>文件格式</dt><dd>{book.format}</dd></div>
              <div><dt>文件语言</dt><dd>{book.language}</dd></div>
              {fileSize && <div><dt>文件大小</dt><dd>{fileSize}</dd></div>}
              {pdfPages && <div><dt>PDF页数</dt><dd>{pdfPages} 页</dd></div>}
              {fileInfo && <>
                <div><dt>文字检索</dt><dd>{getBookTextSearchLabel(fileInfo)}</dd></div>
                <div><dt>PDF书签</dt><dd>{fileInfo.bookmarkCount ? `${fileInfo.bookmarkCount} 项书签` : "无内嵌书签"}</dd></div>
              </>}
            </dl>
            {fileInfo && fileInfo.pagesWithText > 0 && <p className="file-information-note">配图中的文字可能无法搜索。</p>}
          </section>
          <ResourceButton id={book.id} resourceStatus={book.resourceStatus} />
        </div>
      </div>
      <nav className="book-section-navigation" aria-label="书籍内容导航">{sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}</nav>
      <div className="detail-reading-layout">
        <div className="reading-content">
          <section id="introduction" className="reading-section"><h2>内容介绍</h2>{(detail?.overview || readingNote?.paragraphs || [book.introduction]).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>
          {detail?.contents?.items.length ? <section id="contents" className="reading-section"><h2>{detail.contents.label}</h2>
            <ol className="book-contents-list">{detail.contents.items.map((item, index) => <li key={`${index}-${item.title}`}><span>{item.title}</span>{item.originalTitle && <small lang={bookLanguageCode(book)}>{item.originalTitle}</small>}</li>)}</ol>
          </section> : null}
          <section id="highlights" className="reading-section"><h2>核心主题</h2>{detail ? <div className="book-topic-list">{detail.topics.map((topic) => <div key={topic.title}><h3>{topic.title}</h3><p>{topic.description}</p></div>)}</div> : <ul className="highlights-list">{book.highlights.map((text, index) => <li key={index}><span className="highlight-number">{String(index + 1).padStart(2, "0")}</span><p>{text}</p></li>)}</ul>}</section>
          {detail?.authorProfiles?.length ? <section id="authors" className="reading-section"><h2>{contributorHeading}</h2><div className="book-author-profiles">{detail.authorProfiles.map((author) => <div key={author.name}><h3>{author.name}</h3><p>{author.description}</p></div>)}</div></section> : null}
          <section id="audience" className="reading-section"><h2>适合谁读</h2><ul className="audience-list">{book.audience.map((text, index) => <li key={index}>{text}</li>)}</ul></section>
          {(detail || readingNote) && <section id="reading-tips" className="reading-section"><h2>阅读建议</h2>{detail ? <ol className="book-reading-path">{detail.readingPath.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol> : <><ol className="reading-tips-list">{readingNote?.readingTips.map((tip) => <li key={tip}>{tip}</li>)}</ol><div className="selection-note"><h3>选这本书之前</h3><p>{readingNote?.selectionNote}</p></div></>}</section>}
          {comparisons.length > 0 && <section id="book-comparisons" className="reading-section"><h2>同类书怎么选</h2><div className="detail-comparison-list">{comparisons.map(({ book: other, reason }) => <div key={other.id}><Link href={`/books/${other.slug}`} className="detail-comparison-cover"><Image src={other.cover.src} width={other.cover.width} height={other.cover.height} alt={bookImageAlt(other)} sizes="72px" /></Link><div><h3><Link href={`/books/${other.slug}`}>{other.title}</Link></h3><p>{reason}</p></div></div>)}</div></section>}
          {detail?.questions.length ? <section id="reading-questions" className="reading-section"><h2>阅读问答</h2><div className="book-question-list">{detail.questions.map((question) => <div key={question.question}><h3>{question.question}</h3><p>{question.answer}</p></div>)}</div></section> : null}
          {book.previews.length > 0 && <section id="previews" className="reading-section"><h2>精选内页</h2>
            <p className="section-helper">点击图片，查看清晰的原书内页。</p><div className="preview-grid">{book.previews.map((preview, index) => <figure key={preview.src}><a href={preview.src} target="_blank" rel="noopener noreferrer" aria-label={`查看${preview.caption || `第 ${preview.page || index + 1} 页`}完整图片`}><Image src={preview.src} alt={preview.alt || `${book.title}精选内页${preview.page ? `，第 ${preview.page} 页` : ""}`} width={preview.width} height={preview.height} sizes="(max-width: 767px) calc(50vw - 48px), 360px" /></a><figcaption>{preview.caption || "原书内页"}{preview.page && !new RegExp(`第\\s*${preview.page}\\s*页`).test(preview.caption || "") ? <span>PDF 第 {preview.page} 页</span> : null}</figcaption></figure>)}</div>
          </section>}
          {readingGuides.length > 0 && <section className="reading-section" id="reading-guides"><h2>相关选书指南</h2><div className="book-guide-links">{readingGuides.map((guide) => <GuideLink key={guide.slug} guide={guide} />)}</div></section>}
          {detail?.sources?.length ? <section className="reading-section book-references" id="book-references"><h2>相关资料</h2><ul>{detail.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<span aria-hidden="true"> ↗</span></a></li>)}</ul></section> : null}
        </div>
        <aside className="book-reading-sidebar"><div><h2>本页目录</h2>{sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}</div></aside>
      </div>
    </article>
    {related.length > 0 && <section className="related-books"><h2>继续阅读</h2><div className="book-grid">{related.map((other) => <BookCard key={other.id} book={other} />)}</div></section>}
    <Link className="back-to-catalog" href="/"><ArrowLeftIcon aria-hidden="true" />返回全部书籍</Link>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(workSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) }) }} />
  </div>;
}
