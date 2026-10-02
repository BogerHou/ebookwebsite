"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { CONTACT_EMAIL, CONTACT_TOPICS, contactMailto, type ContactBook, type ContactTopic } from "@/lib/contact";

export function ContactComposer({ initialTopic, book }: { initialTopic: ContactTopic; book?: ContactBook }) {
  const [topic, setTopic] = useState(initialTopic);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setCopyError("");
    } catch { setCopyError("无法自动复制，请手动选中邮箱地址复制。"); }
  }

  return <div className="contact-composer">
    <div className="contact-email">
      <a href={contactMailto(topic, message, book)}>{CONTACT_EMAIL}</a>
      <button type="button" onClick={copyEmail} aria-label={copied ? "邮箱地址已复制" : "复制邮箱地址"}>
        {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}{copied ? "已复制" : "复制"}
      </button>
    </div>
    {copyError && <p className="contact-status" role="alert">{copyError}</p>}
    {book && <div className="contact-book"><span>反馈书籍</span><a href={book.url}>{book.title}</a><p>{book.originalTitle}</p></div>}
    <div className="contact-field">
      <label htmlFor="contact-topic">反馈类型</label>
      <select id="contact-topic" value={topic} onChange={(event) => setTopic(event.target.value as ContactTopic)}>
        {CONTACT_TOPICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </div>
    <div className="contact-field">
      <label htmlFor="contact-message">问题描述</label>
      <textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={6} maxLength={2000} placeholder="请说明遇到的情况，例如页面提示、出错步骤或需要更正的信息。" aria-describedby="contact-message-hint" />
      <p id="contact-message-hint" className="contact-hint">{book ? "邮件会带上这本书的名称和页面地址。" : "与书籍有关的问题，请附上书名或书籍页地址。"}请勿填写密码或验证码。</p>
    </div>
    <a className="button button-primary" href={contactMailto(topic, message, book)}><EnvelopeClosedIcon aria-hidden="true" />打开邮件发送</a>
    <p className="contact-hint">请在邮件应用中确认内容并发送。如果没有打开邮件应用，可复制上方邮箱地址，在常用邮箱中写信。</p>
  </div>;
}
