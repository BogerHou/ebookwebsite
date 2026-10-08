<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 公开内容铁律

书径是已经公开发布、面向读者的网站。任何新建或修改的公开内容，在发布前必须逐条审查；不允许把开发者与站长之间的交流写进网站。

- 正文、标题、描述、问答、图片说明、alt、无障碍标签、按钮、空状态、错误提示、分享预览、结构化数据以及动态领取/反馈结果，全部属于审查范围。
- 禁止公开对话转述、给站长或编辑的指令、建站或开发过程、实现方案、部署/环境变量/接口配置、采集上传和核验过程、SEO引流与运营计划、尚未完成的功能说明。
- 每句话都应帮助读者了解书籍、选择读物、阅读或下载文件、处理实际问题，或理解与自身有关的数据使用。不能帮助读者的内部说明应删除；有用的事实应直接改写为读者可理解的信息。
- 书籍本身涉及编程、开发、研究、技术或经营时，保留准确的主题和作者事实；真实的加载/错误状态、文件限制和必要的隐私披露也要保留。禁止因关键词相同而误删，更不能为了隐藏实现细节而隐瞒数据处理事实。
- 私有证据、核验记录和运营资料留在内部文件，不传给客户端，不进入页面、metadata或JSON-LD。`book-notes.json`中的`evidenceLabel`只作内部证据标签，不得渲染。
- 新增或修改内容后，先完整阅读受影响的公开文案，再运行`npm run check`和页面HTTP检查；自动检查仅作辅助，不能代替语义审查。提交/发布说明应记录审查范围、发现的问题和修正结果。
- 发布前复查完整页面及动态交互，确认新的措辞不再包含旧的内部说明。线上缺少问题样例时，仍需检查源文件中的异常/空状态，不能只检查正常页面截图。
