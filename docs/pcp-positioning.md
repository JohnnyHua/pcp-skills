# PCP 定位说明

## PCP 是什么

PCP（Progress Control Plane）不是一个普通 skill，也不是一个独立 agent。它更像是悬在 agent 之上的开发流程控制层：定义任务如何规划、如何推进、何时记录、何时交接，而真正执行代码工作的人仍然是 agent。

可以把 PCP 理解为面向 AI Agent 协作开发的 control plane：

- Agent 负责执行
- PCP 负责流程约束与状态连续性
- 宿主环境负责提供运行时能力（plugin、hook、tool calling）

## 为什么叫 Progress Control Plane

`Progress` 强调的不是“项目进度条”本身，而是开发过程中的连续推进：任务不丢、状态不乱、交接不断线。`Control Plane` 强调 PCP 不是写代码的执行者，而是位于 agent 之上的控制层，负责约束流程、维护状态、驱动 handoff/intake 与记录体系。

这个名字的好处是：

- 不把 PCP 误解成普通 task manager
- 不把 PCP 误解成新的 coding agent
- 能准确表达“它管的是开发推进，而不是具体实现动作”

## PCP 不是什么

- 不是新的大模型或 coding agent
- 不是给用户学习几十条命令的工具箱
- 不是替代现有 `/plan`、`/handoff` 等 skill 的命名层
- 不是项目管理软件本身

PCP 更接近一个“无感运行”的底层流程系统。理想情况下，用户只表达意图：规划、继续、记到 backlog、生成交接。Agent 或 hook 在背后自动把这些动作映射到 PCP 的流程状态。

## PCP 当前已完成的第一阶段

本仓库当前已经完成了一个可运行的 OpenCode 参考实现，而不是停留在概念阶段：

- `plugin/pcp.ts`：OpenCode plugin + auto hooks + `pcp_*` 工具
- `skills/`：安装、项目接入、sprint review 等 skill
- `.opencode/pcp/` 数据模型：`stack.json`、`events.jsonl`
- 项目记录：`PROJECT.md`、`WORKLOG.md`
- 交接能力：`pcp_handoff` 生成 `HANDOFF.md`

因此，第一阶段可以定义为：

> 在 OpenCode 中验证 PCP 作为开发流程控制层是否成立，并证明 task queue、backlog、worklog、handoff 这几条核心能力能真实工作。

## PCP 与 OpenCode / Claude Code / ChatGPT / CrewAI 的关系

### OpenCode

OpenCode 是 PCP 当前最适合的宿主环境。原因不是“PCP 属于 OpenCode”，而是 OpenCode 提供了最直接的 plugin 和 hook 能力，足够承载 PCP runtime。

关系可以表述为：

- OpenCode = 运行底盘
- PCP = 装在底盘上的开发流程系统

### Claude Code

Claude Code 也是 agent 宿主，并且有 hooks。它未来可以成为 PCP 的第二个运行时实现，但当前仓库还没有适配层。

### ChatGPT

ChatGPT 更适合作为 planner / analyst / handoff 消费方，而不是第一阶段的 PCP runtime。它可以参与规划和交接，但不适合先承担本地开发流程自动化。

### CrewAI

CrewAI 更偏多 agent 编排框架，重点在“谁来做、怎么协作”。PCP 更偏开发流程控制，重点在“开发状态怎么管理、任务怎么推进、交接怎么不断线”。

两者不是同类产品：

- CrewAI 偏 orchestration
- PCP 偏 development control plane

## PCP 的使用方式

PCP 成熟后的理想体验应该是“无感”：

- 用户说“帮我规划一下” -> agent 进入 PCP planning flow
- 用户说“继续做” -> agent 从当前 task/queue 继续执行
- 用户说“这个后面再做” -> agent capture 到 backlog
- 用户说“给另一个工具交接” -> agent 生成 handoff

也就是说，用户接触的是高层意图，PCP 在背后维护：

- Goal
- Plan
- TaskCard
- Queue
- Backlog
- Worklog
- Changelog
- Handoff
- Event Log

## 这个项目的独特点

随着 vibecoder 和 AI coding 工具越来越多，真正稀缺的不是再多一个 agent，而是让多个 agent 在同一个项目里不丢上下文、不乱流程、不失去节奏。PCP 的价值就在这里：

- 它不和大厂比模型能力
- 它不和 coding agent 比写代码能力
- 它做的是跨 agent 的开发流程控制层
- 它的护城河是状态连续性、handoff/intake、worklog/changelog、backlog 与任务推进纪律

## 下一步方向

当前最现实的路线不是“一步到位支持所有 agent”，而是：

1. 继续把 OpenCode 参考实现打磨完整
2. 把 handoff/intake 抽象成更稳定的 PCP 语义
3. 再评估 Claude Code 适配
4. 最后让 ChatGPT 等工具优先作为 plan/handoff 协作节点接入

这样 PCP 才是一个逐步扩展的架构，而不是一次性做成所有工具的巨型平台。
