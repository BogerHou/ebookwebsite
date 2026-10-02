import type { Metadata } from "next";
import Link from "next/link";

const title = "下载与阅读帮助";
const description = "了解如何领取书径的阅读资源、打开百度网盘分享文件夹、保存或下载原文PDF，以及处理提取码、预览和下载问题。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/help" },
  openGraph: { title, description, url: "/help", images: [{ url: "/opengraph-image" }] },
};

export default function HelpPage() {
  return <div className="container about-page support-page">
    <div className="page-introduction">
      <h1>下载与阅读帮助</h1>
      <p>从领取链接到打开原书，按下面的步骤开始阅读。</p>
    </div>
    <div className="about-prose">
      <h2>如何获取一本书</h2>
      <ol>
        <li><strong>在书籍页点击“免费获取”。</strong>可领取的书会显示百度网盘入口；暂不提供下载的书，可以先阅读书籍介绍，如有内页预览，也可先查看。</li>
        <li><strong>复制提取码。</strong>领取后点击提取码旁的“复制”。若浏览器无法自动复制，可以手动选中提取码复制。</li>
        <li><strong>打开百度网盘。</strong>点击“打开百度网盘”，按分享页面的提示输入提取码。若页面已自动填入或没有要求输入，可以继续浏览。</li>
        <li><strong>进入中文书名文件夹。</strong>分享内容按中文书名整理，原文PDF放在文件夹内。文件名可能是英文，请结合书籍页的原文题名核对。</li>
        <li><strong>保存或下载PDF。</strong>保存到网盘是放入你的百度网盘空间；下载是将文件存到电脑或手机。需要登录或打开客户端时，按百度网盘页面的提示操作。</li>
        <li><strong>打开文件阅读。</strong>下载完成后，用支持PDF的阅读器打开。若网盘在线预览没有显示全部内容，可以下载后阅读完整文件。</li>
      </ol>

      <h2>中文介绍与原文PDF</h2>
      <p>书径提供中文导读，帮助你了解内容、目录和适合读者。下载文件保留原书语言，大部分为英文；中文书名和中文介绍不表示文件含有中文译文。领取前请查看书籍页的语言、版本和PDF页数。</p>

      <h2>在电脑和手机上阅读</h2>
      <p>电脑可以先在浏览器打开分享链接；如百度网盘提示使用客户端，再通过官方客户端完成下载。手机可按分享页面提示在浏览器或百度网盘App中打开，保存后再下载或阅读。不同设备和网盘版本的操作入口可能不同，请以你看到的界面为准。</p>
      <p>查看<a href="https://yun.baidu.com/disk/help" target="_blank" rel="noopener noreferrer">百度网盘官方帮助</a>，可进一步了解文件保存、下载和设备空间问题。</p>

      <h2>常见问题</h2>
      <h3>领取资源需要付费吗？</h3>
      <p>书径标注“免费”的资源可免费领取。百度网盘的会员、下载加速等服务由百度提供，可按自己的需要选择；领取书径链接不需要在本站付款。</p>

      <h3>为什么要求登录百度账号？</h3>
      <p>保存到自己的网盘以及部分下载操作可能需要百度账号。请在百度网盘官方页面或App中登录；书径不会向你索取百度账号密码或验证码。</p>

      <h3>提取码错误或链接失效怎么办？</h3>
      <p>先回到书籍页重新领取，核对提取码是否复制完整、是否带有多余空格。如果仍无法打开，请通过<Link href="/contact?topic=broken-link">链接失效反馈</Link>告诉我们书名、书籍页地址和页面提示。</p>

      <h3>保存成功后，为什么手机还不能离线阅读？</h3>
      <p>保存到网盘只完成了云端保存，文件还没有下载到设备。请在网盘中找到对应PDF并完成下载；若提示空间不足，分别检查网盘容量和手机或电脑的可用空间。</p>

      <h3>PDF无法打开，或内容与书籍页不符怎么办？</h3>
      <p>先确认下载已完成，再尝试用支持PDF的阅读器打开。若文件仍无法阅读，或题名、版本与书籍页不符，可在<Link href="/contact">联系与反馈</Link>中说明问题。截图请遮住账号等个人信息。</p>

      <Link className="button button-primary" href="/">继续找书</Link>
    </div>
  </div>;
}
