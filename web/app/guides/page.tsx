import type { Metadata } from "next";
import { GuideLink } from "@/components/guide-link";
import { getGuides } from "@/lib/editorial";
import { absoluteUrl, jsonLd } from "@/lib/site";

export const metadata: Metadata = { title: "英文原版书选书指南", description: "从运动解剖学、帆船、木工、攀登、骑行与亲子活动出发，比较原版书的阅读方向，找到适合自己的英文读物。", alternates: { canonical: "/guides" } };
export default function GuidesPage() {
  const guides = getGuides();
  return <div className="container guides-page">
    <div className="page-introduction"><h1>英文原版书选书指南</h1><p>比较同一主题下的书籍差异，先确定阅读方向，再决定从哪里开始。</p></div>
    <div className="guide-directory">{guides.map((guide) => <GuideLink key={guide.slug} guide={guide} />)}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: "英文原版书选书指南", url: absoluteUrl("/guides"), inLanguage: "zh-CN", mainEntity: { "@type": "ItemList", itemListElement: guides.map((guide, index) => ({ "@type": "ListItem", position: index + 1, name: guide.title, url: absoluteUrl(`/guides/${guide.slug}`) })) } }) }} />
  </div>;
}
