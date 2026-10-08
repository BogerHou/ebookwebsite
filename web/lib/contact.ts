export const CONTACT_EMAIL = "hello@ebooknest.store";

export const CONTACT_TOPICS = [
  { value: "broken-link", label: "链接失效" },
  { value: "book-correction", label: "书籍信息纠错" },
  { value: "download-help", label: "下载与阅读问题" },
  { value: "other", label: "其他反馈" },
] as const;

export type ContactTopic = typeof CONTACT_TOPICS[number]["value"];
export type ContactBook = { title: string; originalTitle: string; url: string };

export function getContactTopic(value?: string): ContactTopic {
  return CONTACT_TOPICS.find((topic) => topic.value === value)?.value || "other";
}

export function contactHref(topic: ContactTopic, bookId?: string): string {
  const query = new URLSearchParams({ topic });
  if (bookId) query.set("book", bookId);
  return `/contact?${query.toString()}`;
}

function contactContent(topic: ContactTopic, message: string, book?: ContactBook): { subject: string; body: string } {
  const label = CONTACT_TOPICS.find((item) => item.value === topic)?.label || "其他反馈";
  const subject = `书径 · ${label}${book ? ` · ${book.title}` : ""}`;
  const body = [
    `反馈类型：${label}`,
    ...(book ? [`书名：${book.title}`, `原文题名：${book.originalTitle}`, `书籍页面：${book.url}`] : []),
    "", "问题描述：", message.trim(),
  ].join("\n");
  return { subject, body };
}

export function contactDraft(topic: ContactTopic, message: string, book?: ContactBook): string {
  const { subject, body } = contactContent(topic, message, book);
  return [`收件人：${CONTACT_EMAIL}`, `主题：${subject}`, "", body].join("\n");
}

export function contactMailto(topic: ContactTopic, message: string, book?: ContactBook): string {
  const { subject, body } = contactContent(topic, message, book);
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
