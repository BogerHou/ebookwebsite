import type { Metadata } from "next";
import Link from "next/link";

const title = "隐私说明";
const description = "了解书径在浏览、资源领取与邮件反馈中处理的信息、Google Analytics访问统计、Cookie及第三方服务。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { title, description, url: "/privacy", images: [{ url: "/opengraph-image" }] },
};

export default function PrivacyPage() {
  return <div className="container about-page support-page">
    <div className="page-introduction">
      <h1>隐私说明</h1>
      <p>了解你使用书径时，哪些信息会被用于提供服务和改进阅读体验。</p>
    </div>
    <div className="about-prose">
      <p>更新于 <time dateTime="2026-10-08">2026年10月8日</time>。本说明适用于 ebooknest.store 的浏览、资源领取和联系反馈。</p>

      <h2>浏览与访问统计</h2>
      <p>书径使用Google Analytics 4了解读者浏览了哪些页面、如何找到网站、搜索了哪些书籍，以及资源领取情况，以改进内容和使用体验。统计可能包括页面地址与标题、浏览和滚动等操作、站内搜索词、浏览器与设备信息、访问来源和大致地区。请勿在站内搜索框中输入邮箱、电话等个人信息。</p>
      <p>成功获取网盘入口时，访问统计会记录对应书籍，用于了解资源使用情况。此记录不代表文件已经下载到设备。访问统计不包含网盘分享地址、提取码或反馈邮件正文，也不用于个性化广告。关于统计信息的处理，可查看<a href="https://support.google.com/analytics/answer/11593727?hl=zh-Hans" target="_blank" rel="noopener noreferrer">Google Analytics数据收集说明</a>。</p>

      <h2>Cookie与连接信息</h2>
      <p>访问统计会使用Cookie和统计标识来区分浏览器及访问会话。Cookie是保存在浏览器中的小型数据。你可以在浏览器设置中查看、删除或限制Cookie；删除Cookie不等于停止全部访问统计。Google提供<a href="https://tools.google.com/dlpage/gaoptout?hl=zh_CN" target="_blank" rel="noopener noreferrer">停用Google Analytics的浏览器插件</a>，具体支持情况以其官方说明为准。</p>
      <p>为提供网页与访问统计服务，Google Analytics、Cloudflare和Vercel可能处理IP地址、请求时间、设备信息和访问路径等连接信息。详情可查看<a href="https://support.google.com/analytics/answer/6004245?hl=zh-Hans" target="_blank" rel="noopener noreferrer">Google Analytics数据保护说明</a>、<a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare隐私政策</a>及<a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Vercel隐私说明</a>。</p>

      <h2>领取资源与复制提取码</h2>
      <p>浏览书籍和领取免费资源无需注册书径账号。请仅在百度网盘官方页面或App中登录百度账号；书径不会要求你提供百度账号密码。点击“复制”会将所示提取码放入设备剪贴板，书径不会读取你原有的剪贴板内容。</p>

      <h2>联系与反馈</h2>
      <p><Link href="/contact">联系与反馈</Link>通过你的邮件应用发送邮件。你在页面填写的内容仅用于准备邮件，不会提交给书径网站；请在邮件应用中确认收件人与内容后发送。</p>
      <p>邮件发出后，你的邮箱地址、正文和自行添加的附件会由邮件服务商处理，并由我们用于核对问题和回复。请只提供处理问题所需的信息，截图请遮住账号、电话号码等个人信息，不要发送密码或验证码。</p>

      <h2>打开外部网站</h2>
      <p>百度网盘、出版社和相关资料链接会带你离开书径。你在这些网站登录、保存或下载文件时，信息由相应服务商按其自身说明处理；请留意所在网站的地址及隐私政策。</p>

      <h2>隐私问题与说明更新</h2>
      <p>如对本说明或反馈邮件中的个人信息有疑问，可通过<Link href="/contact">联系与反馈</Link>联系我们。信息处理方式发生变化时，我们会更新本页及上方日期。</p>
    </div>
  </div>;
}
