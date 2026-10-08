"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { CONTACT_EMAIL, CONTACT_TOPICS, contactDraft, contactMailto, type ContactBook, type ContactTopic } from "@/lib/contact";

export function ContactComposer({ initialTopic, book }: { initialTopic: ContactTopic; book?: ContactBook }) {
  const [topic, setTopic] = useState(initialTopic);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState<string | null>(null);
  const [showDraft, setShowDraft] = useState(false);
  const [copyError, setCopyError] = useState("");
  const draft = contactDraft(topic, message, book);
  const draftCopied = copiedDraft === draft;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setCopiedDraft(null);
      setCopyError("");
    } catch { setCopyError("无法自动复制，请手动选中邮箱地址复制。"); }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopiedDraft(draft);
      setCopied(false);
      setShowDraft(false);
      setCopyError("");
    } catch {
      setShowDraft(true);
      setCopyError("无法自动复制，请手动选中下方邮件草稿复制。");
    }
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
      <select id="contact-topic" value={topic} onChange={(event) => { setTopic(event.target.value as ContactTopic); setCopiedDraft(null); }}>
        {CONTACT_TOPICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </div>
    <div className="contact-field">
      <label htmlFor="contact-message">问题描述</label>
      <textarea id="contact-message" value={message} onChange={(event) => { setMessage(event.target.value); setCopiedDraft(null); }} rows={6} maxLength={2000} placeholder="请说明遇到的情况，例如页面提示、出错步骤或需要更正的信息。" aria-describedby="contact-message-hint" />
      <p id="contact-message-hint" className="contact-hint">{book ? "邮件会带上这本书的名称和页面地址。" : "与书籍有关的问题，请附上书名或书籍页地址。"}请勿填写密码或验证码。</p>
    </div>
    <div className="hero-actions">
      <a className="button button-primary" href={contactMailto(topic, message, book)}><EnvelopeClosedIcon aria-hidden="true" />打开邮件发送</a>
      <button type="button" className="button button-secondary" onClick={copyDraft} aria-label={draftCopied ? "邮件草稿已复制" : "复制邮件草稿"}>{draftCopied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}{draftCopied ? "草稿已复制" : "复制邮件草稿"}</button>
    </div>
    <p className="contact-hint">请在邮件应用中确认内容并发送。如果没有打开邮件应用，可复制邮件草稿，粘贴到常用邮箱后发送。</p>
    {showDraft && <div className="contact-field"><label htmlFor="contact-draft">邮件草稿</label><textarea id="contact-draft" value={draft} readOnly rows={10} /></div>}
  </div>;
}
