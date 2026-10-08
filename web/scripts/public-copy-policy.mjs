// These checks catch known internal-copy patterns. Contextual review of every
// changed public sentence is still required by AGENTS.md.
const rules = [
  { name: "编辑与核验过程", pattern: /已核验|已核对|核验前页|导读整理说明|正在整理|资源正在准备|正在补充|排版转换|非全书评测|依据原书题名|(?:本页|本站|本网站|本篇导读|本篇介绍)(?:的)?(?:内容|介绍|导读|正文)?(?:由|使用|采用)?AI\s*辅助(?:生成|编写|整理|撰写)/gu },
  { name: "对话与站长指令", pattern: /(?:根据|按照|按)(?:你的要求|你提供的|你给的)|你给(?:我|我们)的(?:图片|截图|文件)|项目下面|本书应保留这一共同创作信息/gu },
  { name: "未完成的功能计划", pattern: /购买功能暂未开放|资源领取暂未开放|(?:后续|之后|未来)(?:再|将|会)?(?:接入|实现|开发)(?:支付|付费|购买功能)/gu },
  { name: "内部实现说明", pattern: /未检测到可检索文字|统计请求经.{0,30}转交|公开书籍编号|网站根据书籍编号返回/gu },
  { name: "内部文件路径", pattern: /\/Users\/[^\s"'<>]+/gu },
];

export function publicCopyIssues(text) {
  return rules.flatMap(({ name, pattern }) => [...String(text).matchAll(pattern)].map((match) => ({ rule: name, text: match[0] })));
}

export function publicCopyMatches(text) {
  return [...new Set(publicCopyIssues(text).map((issue) => issue.text))];
}

export function publicCopyMatchesInValue(value) {
  if (typeof value === "string") return publicCopyMatches(value);
  const items = Array.isArray(value) ? value : value && typeof value === "object" ? Object.values(value) : [];
  return [...new Set(items.flatMap(publicCopyMatchesInValue))];
}
