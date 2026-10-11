<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Vercel 额度与成本铁律

- 技术实现、涉及资源调用的修改和上线验收必须检查Vercel额度与运行成本。调用框架组件前核对默认网络行为；功能可用、构建成功、页面快均不能代替成本验收。使用全局`vercel-cost-guard`技能；不可用时按本节执行。
- 本站以固定书目和导读为主，默认首页、分类、目录分页、书籍、指南及帮助页面应静态生成并由CDN分发。必要的查询渲染和领取接口单独保留；不可把全站改成动态，也不可牺牲初始HTML、直达搜索、分页、canonical/noindex或真实404。
- 书籍图片在构建时生成有限尺寸，直接加载带版本的静态WebP，不恢复`next/image`默认转换。维护`images.unoptimized`和项目中对`/_next/image`、`/_vercel/image`的精确Deny规则。图片换源、延长缓存或原图为WebP，都不能单独证明停止转换。
- 密集书目和分页链接禁止自动预取整批未访问内容；保留真实href和点击导航。统计不得重复初始化，客户端不得自动领取、轮询或无限重试。完整PDF不进入公开目录，不由Vercel代理传输。
- 本站按查询参数重写到独立动态页面；带查询的分页和反馈链接必须发起文档导航，避免Next客户端复用同路径的静态内容。验收须先访问默认页，再打开同路径带查询链接，并检查列表、反馈上下文、noindex和结构化数据；直达HTTP正常不足以证明站内导航正确。
- 领取接口的`private,no-store`是访问控制边界，不能为省函数把私有分享链接放入公开CDN缓存或客户端。必要动态调用必须有明确触发原因和边界；先减少非必要调用，不盲目关闭业务功能。
- 发布前运行项目检查、生产构建和成本回归检查，读取最新静态/动态清单；发布后用少量代表页面验证缓存、图片请求、预取、搜索分页和领取交互。核对当前官方计费及可读取的项目用量；无账户数据时明确记录缺口，不把代码检查称为完整额度审计。
- 额度紧张时，禁止为验收产生真实栅格图片转换、付费调用或生产压力测试。无效参数400不能证明转换关闭；应核对部署配置或明确的403 Deny。历史用量不会立即清零，静态传输与CDN请求仍使用额度。
- 详细项目要求见`docs/vercel-cost-policy.md`。成本审查记录只保留在内部文档；任何新增公开文案仍须遵守下方公开内容铁律。

## 公开内容铁律

书径是已经公开发布、面向读者的网站。任何新建或修改的公开内容，在发布前必须逐条审查；不允许把开发者与站长之间的交流写进网站。

- 正文、标题、描述、问答、图片说明、alt、无障碍标签、按钮、空状态、错误提示、分享预览、结构化数据以及动态领取/反馈结果，全部属于审查范围。
- 禁止公开对话转述、给站长或编辑的指令、建站或开发过程、实现方案、部署/环境变量/接口配置、采集上传和核验过程、SEO引流与运营计划、尚未完成的功能说明。
- 每句话都应帮助读者了解书籍、选择读物、阅读或下载文件、处理实际问题，或理解与自身有关的数据使用。不能帮助读者的内部说明应删除；有用的事实应直接改写为读者可理解的信息。
- 书籍本身涉及编程、开发、研究、技术或经营时，保留准确的主题和作者事实；真实的加载/错误状态、文件限制和必要的隐私披露也要保留。禁止因关键词相同而误删，更不能为了隐藏实现细节而隐瞒数据处理事实。
- 私有证据、核验记录和运营资料留在内部文件，不传给客户端，不进入页面、metadata或JSON-LD。`book-notes.json`中的`evidenceLabel`只作内部证据标签，不得渲染。
- 新增或修改内容后，先完整阅读受影响的公开文案，再运行`npm run check`和页面HTTP检查；自动检查仅作辅助，不能代替语义审查。提交/发布说明应记录审查范围、发现的问题和修正结果。
- 发布前复查完整页面及动态交互，确认新的措辞不再包含旧的内部说明。线上缺少问题样例时，仍需检查源文件中的异常/空状态，不能只检查正常页面截图。
