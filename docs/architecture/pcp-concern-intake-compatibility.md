# PCP Concern Log, Handoff Intake, And Host Compatibility

## 文档目的

本文补上 PCP 架构中的三块关键缺口：

1. `Concern Log`：把当前不实现、但未来必须重新讨论的问题记住
2. `Handoff / Intake`：把跨 agent 切换从“导出文档”升级为“可恢复流程”
3. `Host Compatibility`：定义 PCP 与宿主 agent 规则、skills、hooks 的边界

本文同时确认一个新的架构决策：

> Plan 可以由任意外部 agent 生成；PCP 不负责替代 planner，而负责标准化、编译、装载与后续开发流程控制。

## 一、Concern Log

### 1. 定义

`Concern Log` 不是普通 backlog，也不是当前任务。它是“延迟触发的设计关注点”：

- 现在不一定实现
- 但当系统走到某个阶段时，必须重新拿出来讨论

它服务的不是当前开发动作，而是未来阶段的架构提醒。

### 2. 与 Backlog 的区别

- `Backlog`
  - 以后可能要做的需求、功能、优化项
- `Concern Log`
  - 以后做到某一步时必须重新确认的问题、边界、风险、约束

例子：

- “Claude Code 适配时要处理 host policy 冲突” -> Concern Log
- “项目结束后做技术总结归档” -> Backlog

### 3. 触发方式

Concern Log 应支持以下触发条件：

- 进入某个实现阶段
- 创建某类 TaskCard
- 进入某个宿主环境适配
- 生成/接收 handoff

### 4. 当前工作约定

从现在起，在这轮架构设计阶段：

- 你提出的“未来会遇到的问题”
- 如果你没有明确说“放 backlog”
- 默认进入 Concern Log 范畴

也就是说，后续新的架构担忧、兼容问题、恢复问题，我会优先补到这条文档线里，而不是当成功能 backlog。

## 二、Handoff / Intake

### 1. Handoff 的定位

`Handoff` 是跨 agent / 跨工具切换时的交接快照。它的目标不是保存全部历史，而是把当前继续工作所需的最小必要上下文压缩出来。

Handoff 应包含：

- 当前 Goal
- 当前主任务 / 子任务
- 当前 Queue 摘要
- 待处理 backlog
- 最近关键事件
- 当前风险与阻塞点
- 建议下一步

### 2. PCP 语义与通用 Markdown

Handoff 应同时具备两层：

- 上层：人可读 Markdown
- 下层：PCP 语义字段

这样做的原因是：

- 不支持 PCP 的工具也能继续读文档
- 支持 PCP 的 runtime 可以进一步解析和恢复结构化状态

### 3. Intake 的定位

`Intake` 是读取 handoff 并恢复执行上下文的流程。它不是简单“看一眼 handoff”，而是一次标准动作：

1. 读取 handoff
2. 校验仓库现实
3. 对照 git 状态
4. 对照 PCP 当前状态
5. 恢复当前任务与下一步动作
6. 记录一次接手事件

### 4. 事实源优先级

Intake 时的事实源优先级：

1. 仓库当前代码
2. git 状态
3. PCP runtime 状态
4. Handoff 文档

Handoff 不是最终真相，只是恢复入口。

### 5. 当前实现映射

当前仓库已经有：

- `pcp_handoff`
- `HANDOFF.md`

但还没有：

- 正式的 intake 流程
- PCP-aware handoff 语义层
- handoff 恢复校验步骤

## 三、Host Compatibility

### 1. 核心原则

PCP 是宿主 agent 之下的流程控制层，不应接管宿主 agent 的主控制权。

优先级原则：

`Host agent policy > PCP workflow policy > skill selection`

### 2. 含义

- 宿主环境规则优先
  - 系统 prompt
  - AGENTS.md
  - 宿主原生行为
  - 平台限制
- PCP 做流程层补充
- skill 是节点里使用的能力，不是 PCP 的核心职责

### 3. 与 skills 的关系

PCP 不应该管理所有 skill，也不应该试图统一命名入口。

PCP 负责：

- 什么时候该规划
- 什么时候该继续任务
- 什么时候该 capture backlog
- 什么时候该 review
- 什么时候该 handoff / intake

具体某个节点里调用哪个 skill，仍然由宿主 agent 自己判断。

### 4. 与现有 `/plan`、`/handoff` 的关系

PCP 不需要抢这些名字。无论用户通过：

- 现有 skill
- 自然语言
- 宿主命令

只要最终进入了 PCP 认可的流程节点即可。

### 5. 当前策略

当前阶段：

- OpenCode 作为参考 runtime
- Claude Code 作为后续适配对象
- ChatGPT 主要作为 planner / analyst / handoff 消费方

因此 Host Compatibility 先定义原则，不急于一次性做全适配。

## 四、Plan 边界决策

本轮新增明确决策：

- Plan 可以由任意外部 agent 生成
- PCP 不负责替代外部 planner 拆任务
- PCP 负责：
  - 标准化
  - 校验
  - 计划编译
  - Queue 装载
  - 任务推进
  - Worklog / Changelog
  - Handoff / Intake

这意味着 PCP 的重点不是“比别人更会拆任务”，而是“把别人产出的任务计划纳入统一开发流程”。

## 五、当前 Concern Log 种子项

以下问题已经在当前讨论中出现，后续进入相关阶段时应重新讨论：

1. Claude Code 适配时，如何处理 host agent policy 与 PCP workflow policy 的冲突
2. Handoff 是否应逐步加入更强的 PCP 语义字段，供未来 intake 解析
3. 当宿主已有 `/plan`、`/handoff` 等 skill 时，PCP 如何避免入口冲突
4. TaskCard 持久化后，如何以最小复杂度暴露给 agent 使用
5. 项目完成后的技术总结 / 方法归档应如何与 PCP 主流程衔接
6. 后续是否把“规划 + plan”融合进 PCP，形成更强的自循环
7. 是否补一个更独立的测试/审核环节，而不只是当前 review gate

## 六、下一步建议

在进入真正开发前，下一步最合理的是再补一份“runtime implementation roadmap”，把前四份架构文档压成分阶段实现路线：

1. 先补 `TaskCard` 持久化
2. 再补 `Plan` 持久化与编译
3. 再补 intake
4. 再补 Concern Log 机制
5. 最后再考虑 Claude Code 适配
