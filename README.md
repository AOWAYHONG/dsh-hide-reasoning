# @dsh-external/dsh-hide-reasoning

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.4.0-4d6bfe.svg)](https://github.com/AOWAYHONG/dsh-hide-reasoning/releases)
[![CI](https://github.com/AOWAYHONG/dsh-hide-reasoning/actions/workflows/ci.yml/badge.svg)](https://github.com/AOWAYHONG/dsh-hide-reasoning/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/AOWAYHONG/dsh-hide-reasoning?style=social)](https://github.com/AOWAYHONG/dsh-hide-reasoning)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/AOWAYHONG/dsh-hide-reasoning/pulls)

**English**: [README.en.md](README.en.md)

DeepSeek Harness 客户端插件：把对话里助手的「思考」推理过程折叠行，替换为
**可折叠摘要卡片**（推理本身照常进行、照常流式输出）。

## 效果

每条「思考」行默认收起为一条粉紫色胶囊标签：

```
[ Thinking ^ ]
```

点击展开后显示摘要卡片：

```
┌────────────────────────────────┐
│ ◉ DeepSeek V3   ⭐ Streaming…  │  ← 模型徽章 + 名称 + token 徽章 | 状态 + 耗时徽章
│  [18.6k]           [Thinking]  │
│ Context         18.6k tokens   │
│ Reasoning       8 stages       │  ← 全部由真实推理文本实时派生
│ Tools           Search · Files │
│ ────────────────────────────── │
│ （完整推理正文，流式实时刷新）    │
└────────────────────────────────┘
```

- **模型徽章**：从输入栏模型选择器探测当前模型名（以模型选择器独有的
  effort 徽章为锚点，避免误匹配「设置」等其它下拉菜单），自动匹配对应厂商
  logo（DeepSeek 鲸鱼 / OpenAI / Claude / Gemini / Qwen），探测不到或未收录
  时显示通用思考图标。
- **全部数据真实**：每项指标都来自真实推理文本与 DOM 状态，不编造任何
  展示值。各指标定义见下节。
- **流式实时**：推理过程中摘要与正文随文本更新（150ms 防抖），完成后自动
  记录耗时；已完成的旧消息显示「—」而非伪造耗时。
- **自愈式选择器**：思考行根节点带有语义属性 `data-variant="think"`，不随
  构建哈希变化；install.sh 安装时还会探测真实类名写入
  `__HIDE_REASONING_SELECTOR__` / `__THINKBODY_SELECTOR__` 作为兜底。
- **降级保护**：若某行无法挂载完整正文（选择器漂移等极端情况），该行会
  保持原生可读，绝不把唯一一份推理内容隐藏掉。

## 指标定义（Context / Reasoning / Tools / Completion）

所有指标均为**启发式估算**，来自对该条推理正文的实时分析，非厂商官方数据：

| 指标 | 来源 | 定义 |
|---|---|---|
| **Context** | 推理正文长度 | token 估算：CJK 字符（中日韩）按 1 token/字，其余字符按 4 字符/1 token，向上取整。例如 18.6k 表示估算约 1.86 万 token。 |
| **Reasoning** | 推理正文结构 | 「阶段数」：优先统计显式的 `Step 1 / Stage 2 / 第N步 / 步骤N` 标记；没有标记时按空行分隔的段落数计，上限 20（防止把散文段落误报成大量阶段）。 |
| **Tools** | 推理正文关键词 | 正则检测正文中出现的工具名（Search / Python / Bash / Shell / Grep / curl / ffmpeg / Browser / Subagent / Filesystem），最多列 4 个。注意：这是**文本提及**检测，非真实工具调用记录，可能把散文中的「search」等普通词计入。 |
| **Completion** | DOM `data-state` 变化 | 插件观测到该行 `running → ok` 的**实测毫秒差**。插件加载前就已完成的旧消息无真实耗时，显示「—」；运行中显示「…」。 |

## 可扩展方向（欢迎 PR / 自行添加）

当前卡片只占用了 4 个字段，设计空间还很大。容易添加的候选：

1. **Verification 校验状态**（设计图里有此行）——目前 DSH 不暴露校验数据，可显示
   「Completed / In progress」等状态文本。
2. **工具调用次数**——把 Tools 从「提及列表」升级为「每工具计数」，如
   `Python ×3 · Search ×2`。
3. **耗时分布**——Completion 拆成「思考耗时 + 生成耗时」或显示 token/秒速率。
4. **上下文占比**——Context tokens ÷ 模型上下文窗口（需在 MODEL_LOGOS 中为
   各模型补充 context 长度），如 `18.6k / 128k`。
5. **复制按钮**——卡片右上角加「复制推理全文」。
6. **折叠状态记忆**——用 localStorage 记住每条消息的展开/收起偏好。
7. **更多厂商徽章**——在 `MODEL_LOGOS` 中按同样格式补充 Llama / Mistral /
   Kimi / GLM 等 logo 与匹配正则。

## 目录结构

```
dsh-hide-reasoning/
├── lib/
│   ├── index.js     # 服务端 half（no-op）
│   └── client.js    # 浏览器端 half（折叠摘要卡片）
├── cordis.patch.yml # profile bundle 挂载补丁
└── package.json
```

## 手动排查

若某个未来的 DSH 版本同时改掉了 `data-variant="think"` 属性和 CSS Module
映射格式，打开 DevTools（F12）→ Elements，找到「思考」行最外层元素，把它的
新选择器写进 `lib/client.js` 的 `HIDE_SELECTOR`（或重跑 install.sh），刷新
页面即可。

## 卸载

运行安装包里的 `uninstall.sh`；或从 `~/.dsh/profiles/web/package.json` 的
`dependencies` 与 `dsh.profile.bundles` 中移除本包，执行 `pnpm install`
并重启 `dsh web`。
