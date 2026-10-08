import assert from "node:assert/strict";
import { CONTACT_EMAIL, CONTACT_TOPICS, contactDraft, contactHref, contactMailto, getContactTopic } from "../lib/contact.ts";

const book = { title: "游泳解剖学", originalTitle: "Swimming Anatomy", url: "https://ebooknest.store/books/swimming-anatomy" };
const message = "第一行：打开后没有文件\n第二行：页面提示 A&B + 100% # ? =。";
let checks = 0;

for (const topic of CONTACT_TOPICS) {
  const url = new URL(contactMailto(topic.value, `  ${message}  `, book));
  const draft = contactDraft(topic.value, `  ${message}  `, book);
  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, CONTACT_EMAIL);
  assert.equal(url.searchParams.get("subject"), `书径 · ${topic.label} · ${book.title}`);
  assert.equal(url.searchParams.get("body").split("问题描述：\n")[1], message, "Reserved characters and real newlines must survive mailto encoding");
  assert(draft.startsWith(`收件人：${CONTACT_EMAIL}\n主题：${url.searchParams.get("subject")}\n\n`));
  assert(draft.endsWith(url.searchParams.get("body")), "Copied drafts and mailto must contain the same feedback body");
  assert(draft.includes(`书名：${book.title}\n原文题名：${book.originalTitle}\n书籍页面：${book.url}`));
  checks += 7;
}

const general = contactDraft("other", "普通反馈");
assert(!general.includes("书名："), "General feedback must not invent book context");
assert(general.endsWith("问题描述：\n普通反馈"));
assert.equal(getContactTopic("invalid"), "other");
assert.equal(contactHref("broken-link", "book & one"), "/contact?topic=broken-link&book=book+%26+one");
checks += 4;

console.log(`Contact passed: ${checks} checks. Drafts, book context, mailto encoding and general feedback agree.`);
