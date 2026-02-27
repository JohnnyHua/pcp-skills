# PCP (Progress Control Plane) Skills for OpenCode

AI 编程助手任务管理与待办事项系统。

## 解决什么问题

1. **主线丢失** — Agent 写着写着跑偏了，忘了自己在干嘛
2. **需求蔓延** — 用户中途加需求"Oh also 做一下 X"，直接打乱当前节奏

## 安装

```bash
npx skills add JohnnyHua/pcp-skills
```

然后在 OpenCode 对话框输入：

> 加载 skill pcp-setup 并运行

## 包含组件

| 组件 | 类型 | 作用 |
|------|------|------|
| `pcp.ts` | 插件 | 11 个工具 + 自动生命周期钩子 + 上下文自动注入 |
| `pcp-intake` | Skill | 项目接管流程（5 步引导） |
| `pcp-sprint-review` | Skill | Sprint 结束后的待办回顾（一次问一个） |
| `pcp-setup` | Skill | 30 秒安装所有组件 |

> **无需切换 Agent。** PCP 规则通过插件的 `system.transform` 钩子自动注入所有 Agent。

## 工作原理

### 计划 → 执行 → 计划 循环

```
用户给出 todolist / 计划
  → Agent 解析并调用 pcp_plan(tasks)
  → T001 = 正在做, T002..T005 = 排队中
  → 写 T001 代码，git commit → 自动推进到 T002
  → ...
  → 全部完成 → PCP 提示"让 planner 创建新计划"
```

### Sprint 中途捕获

```
用户: "顺便加个 OAuth 以后"
Agent: 调用 pcp_capture("添加 OAuth") → "已记录到 backlog [B001]，继续当前 sprint"
```

### 排队中新增需求

```
用户在任务之间有新需求
  → 通过 planner 规划 → 新的 todolist
  → pcp_plan(new_tasks) → T006..T008 加入队列
```

### 待办回顾

```
Agent: "[B001] 添加 OAuth — 加入下一个 sprint? A) 是 B) 稍后 C) 忽略"
用户: "A"
Agent: pcp_promote("B001") → 添加为子任务 T006
```

## 工具参考

| 工具 | 说明 |
|------|------|
| `pcp_init` | 扫描项目，建立基线上下文（首次使用时调用） |
| `pcp_plan` | 加载任务列表 — 第一个立即开始，其余排队 |
| `pcp_start` | 手动开始新 sprint |
| `pcp_sub` | 压入子任务 |
| `pcp_done` | 手动完成任务（git commit 会自动触发） |
| `pcp_status` | 查看当前任务栈、队列、待办状态 |
| `pcp_capture` | 记录到待办（暂不执行） |
| `pcp_backlog` | 列出所有待办事项 |
| `pcp_promote` | 将待办项加入当前 sprint |
| `pcp_dismiss` | 永久忽略待办项 |
| `pcp_history` | 查看所有历史 sprint 和待办记录 |

## 环境要求

- [OpenCode](https://opencode.ai) v1.2+
- macOS 或 Linux（Windows 需手动安装）
- Bun 或 Node.js（用于插件编译）

## 数据存储

PCP 所有数据本地存储在 `{项目目录}/.opencode/pcp/`：
- `events.jsonl` — 追加式事件日志（完整历史）
- `stack.json` — 当前状态缓存（含排队任务队列）

> 数据不会离开你的电脑。

## 许可证

MIT
