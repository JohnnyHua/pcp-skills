# PCP Core Model

## 文档目的

本文定义 PCP 的核心对象、主流程和状态边界，并明确当前仓库已经实现到哪一步。目标不是一次性把所有功能做完，而是先把“什么是 PCP 的基础模型”讲清楚，让后续 OpenCode runtime、handoff/intake、Claude Code 适配都能围绕同一套语义演进。

## 一、核心对象

### 1. Goal

用户当前想达成的目标。Goal 是输入层，不要求一开始就知道任务怎么拆，也不要求用户先定义 sprint。

### 2. Plan

一次需求拆解结果。Plan 是静态快照，回答“准备怎么做”，而不是“现在做到哪一步”。任意 agent 都可以产出 Plan，但进入执行前需要被 PCP 编译成可执行任务。

### 3. TaskCard

PCP 的核心执行对象，必须持久化。TaskCard 不是普通待办项，而是半锁定的执行契约：

- 核心区：`title`、`detail`、`acceptance`
- 运行区：`lifecycle_status`、`review_status`、`git_status`、`handoff_status`
- 附加区：`user additions`、`notes`、`tool hints`、`artifacts`

原则：

- agent 不应随意重写核心区
- agent 可以更新运行区
- agent 可以追加 notes / suggestions
- 需要拆解时优先创建子任务卡，而不是改写原卡

### 4. Queue

运行时装载器，不是任务本体。Queue 只关心“当前应该做什么”和“接下来排着什么”，像一个弹夹：TaskCard 是子弹，Queue 是当前装载中的弹夹。

### 5. Backlog

开发中出现但不应立刻打断当前主线的事项。Backlog 的作用是“先收起来，稍后 review”，而不是和当前 Queue 混在一起。

### 6. Worklog

过程记录，主要服务连续执行和 handoff。记录的是“做了什么、为什么这样做、现在卡在哪”。

### 7. Changelog

结果记录，主要服务审查、发布和人类回看。记录的是“这个任务交付后，对外或对项目产生了什么变化”。

### 8. Handoff

跨 agent / 跨工具切换时的上下文快照。它不是事实源，而是恢复入口。事实源优先级始终是：

1. 仓库当前代码
2. git 状态
3. PCP 运行时状态
4. Handoff 文档

### 9. Progress

派生视图，不是原始主对象。它由 Plan、Queue、TaskCard、History 汇总而来，用来展示进度，而不是替代 Plan。

### 10. Event Log

状态变化的事实记录。Event 不是业务对象，而是“发生过什么”的时间线，例如：

- 创建 TaskCard
- Task 从 `ready` 进入 `doing`
- backlog 被 capture
- 生成 handoff
- 完成 review
- git commit 自动推进任务

## 二、核心关系

### 1. Plan 与 Queue

- Plan = 规划结果
- Queue = 执行装载状态

Plan 不等于 Queue。Plan 可以长期保留，Queue 则在执行中不断变化。

### 2. TaskCard 与 Queue

- TaskCard 是持久化对象
- Queue 只引用当前待执行的 TaskCard

### 3. Parent / Child 与 Dependency

TaskCard 需要同时支持：

- `parent-child`
  - 表示任务拆解关系
- `dependency`
  - 表示执行约束关系
  - 分为 `hard dependency` 和 `soft dependency`

这使 PCP 既能表示“这是一个子功能”，也能表示“这个卡必须等另一个卡完成后才能做”。

## 三、主流程

### 1. Planning Flow

`Goal -> Plan -> PCP 计划编译 -> TaskCard + Queue`

任意 agent 都可以做 Plan，但 PCP 要负责：

- 检查任务粒度是否可执行
- 自动细化能安全细化的部分
- 对过于模糊的部分拒绝装载
- 最终把合格内容转成 TaskCard 并装入 Queue

### 2. Task Lifecycle Flow

TaskCard 使用并行状态，而不是单一状态字段：

- `lifecycle_status`
  - `draft / ready / doing / blocked / done / pivoted / dropped`
- `review_status`
  - `pending / human_requested / machine_requested / skipped / approved / rejected`
- `git_status`
  - `none / pending / committed / pushed`
- `handoff_status`
  - `none / prepared / handed_off / resumed`

审核阶段由用户选择：

- `yes` = 人工审核
- `no` = 机器检查
- `skip` = 跳过审核

典型流转：

`doing -> review gate -> human/machine/skip -> git -> done -> next task`

### 3. Logging Flow

每张任务卡完成后，需要同步：

- Worklog：记录过程与关键判断
- Changelog：记录交付变化

### 4. Backlog Flow

`capture -> backlog -> review -> promote / dismiss`

Backlog 是延迟处理池，不应打断当前 Queue。

### 5. Handoff / Intake Flow

- Outbound：生成 handoff，交给下一个 agent
- Inbound：读取 handoff，结合仓库现实恢复上下文

理想形态下，handoff 是用户可读文档，同时保留 PCP 语义，便于后续 intake 解析。

## 四、操作面与协议层

PCP 协议可以比操作面复杂，但复杂性不应暴露给用户，也不应要求 agent 每一步都显式操纵所有字段。

日常暴露给用户/agent 的高层动作应尽量少，例如：

- 规划
- 继续当前任务
- capture backlog
- 完成任务
- review
- handoff
- intake

`pcp_*` 工具只是某个运行时里的操作接口，不是 PCP 本体。

## 五、当前仓库已实现内容

当前 OpenCode 参考实现已经具备以下能力：

### 已实现

- OpenCode plugin runtime：`plugin/pcp.ts`
- 基础状态存储：`.opencode/pcp/stack.json`
- 事件日志：`.opencode/pcp/events.jsonl`
- 当前任务/队列：`pcp_plan`、`pcp_done`、自动推进
- backlog：`pcp_capture`、`pcp_backlog`、`pcp_promote`、`pcp_dismiss`
- 项目基线：`pcp_init` 生成 `PROJECT.md` / `PROJECT.json`
- 过程记录：`WORKLOG.md`
- handoff：`pcp_handoff` 生成 `HANDOFF.md`
- 本地校验：`npm run typecheck`、`npm test`、`npm run check`

### 已部分实现

- 子任务：当前已有 `pcp_sub` 和任务栈，但还不是完整的 TaskCard parent/child 模型
- handoff：当前已能导出，但 intake 还未正式建模
- review / git：已有“完成审查”规则和 `git commit` 自动推进，但还未沉淀成正式并行状态字段

### 尚未实现

- TaskCard 持久化模型
- Plan 持久化与“计划编译”规范
- Progress 派生视图
- intake 正式流程
- review_status / git_status / handoff_status 的完整状态机
- parent-child + dependency 的统一关系模型
- 最终流程图 / 项目总结归档

## 六、下一步建议

下一阶段不应该继续扩散功能，而应优先补三个基础层：

1. `TaskCard` 的持久化结构
2. `Plan -> TaskCard + Queue` 的编译规则
3. `Handoff -> Intake` 的恢复流程

只有这三层稳定下来，PCP 才能真正从 OpenCode 参考实现，成长为跨 agent 可复用的开发流程控制架构。
