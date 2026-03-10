# PCP TaskCard Schema And Plan Compilation

## 文档目的

本文把 PCP 的两个关键能力规格化：

1. `TaskCard` 如何持久化
2. `Plan` 如何被编译成 `TaskCard + Queue`

这份文档的作用是把前两份文档中的概念继续下钻，形成可执行的数据模型和编译规则。后续无论是在 OpenCode 里实现、还是做 Claude Code 适配、handoff/intake 扩展，都应以本文为准。

## 一、TaskCard 的定位

`TaskCard` 是 PCP 的核心执行对象。它不是普通待办项，而是一个半锁定的执行契约：

- 记录任务是什么
- 记录任务现在进行到哪一步
- 记录任务和其他任务的关系
- 记录用户追加的约束与补充
- 为 review、git、handoff、归档、可视化提供稳定载体

原则：

- 核心意图不能被 agent 随意改写
- 运行状态可以由 runtime 自动更新
- 补充信息以追加为主，不鼓励覆盖原意图

## 二、TaskCard 结构

### 1. 核心字段（受保护）

- `id`
- `title`
- `detail`
- `acceptance`
- `created_from_goal`
- `created_from_plan`
- `created_by`
- `parent_id`

这些字段定义“这张卡本来是什么”。一旦卡进入执行，不应由 agent 直接重写；如果理解发生变化，应优先：

- 创建子任务卡
- 追加说明
- 发起变更提议
- 由用户确认修改

### 2. 运行字段（可自动更新）

- `lifecycle_status`
- `review_status`
- `git_status`
- `handoff_status`
- `queue_slot`
- `started_at`
- `completed_at`
- `last_actor`

这部分是运行态，允许 PCP runtime 自动修改。

### 3. 附加字段（追加型）

- `user_additions`
- `notes`
- `agent_suggestions`
- `tool_hints`
- `artifacts`

这些字段用于补充上下文，不应反向污染核心区。

### 4. 关系字段

- `children`
- `hard_dependencies`
- `soft_dependencies`
- `blocked_by`

这样 TaskCard 同时具备：

- 层级关系：父卡 / 子卡
- 依赖关系：必须先做 / 建议先做

## 三、TaskCard 状态模型

### 1. 主状态

`lifecycle_status`

- `draft`
- `ready`
- `doing`
- `blocked`
- `done`
- `pivoted`
- `dropped`

### 2. 审查状态

`review_status`

- `pending`
- `human_requested`
- `machine_requested`
- `skipped`
- `approved`
- `rejected`

用户在 review gate 的选择：

- `yes` -> `human_requested`
- `no` -> `machine_requested`
- `skip` -> `skipped`

### 3. Git 状态

`git_status`

- `none`
- `pending`
- `committed`
- `pushed`

### 4. Handoff 状态

`handoff_status`

- `none`
- `prepared`
- `handed_off`
- `resumed`

## 四、TaskCard 编辑规则

### agent 可以做的事

- 更新运行字段
- 追加 notes / suggestions / tool hints
- 追加 artifacts
- 创建子任务卡
- 标记 blocked / pivoted / done

### agent 不应直接做的事

- 重写 `title`
- 覆盖 `detail`
- 改写 `acceptance`
- 篡改创建来源

### 用户可以做的事

- 补充核心说明
- 修改验收标准
- 追加限制与偏好
- 批准结构性变更

## 五、Plan 的定位

`Plan` 是一次需求拆解结果，而不是运行时状态。它是静态快照，用来回答：

- 这次准备怎么做
- 拆成了哪些阶段 / 任务
- 有哪些显式顺序和依赖

Plan 不等于 Queue。Queue 是运行期装载状态，Plan 是规划基线。

## 六、计划编译（Plan Compilation）

### 1. 定义

计划编译指的是：

`Plan -> 检查 / 细化 / 规范化 -> TaskCard + Queue`

PCP 不负责代替 planner 重新思考目标，但要负责把 planner 的输出变成可执行对象。

### 2. 编译输入

任意 agent 产出的 Plan 至少应包含：

- 任务项列表
- 顺序信息
- 任务标题
- 基本意图描述

理想情况下还包含：

- 目标文件
- 验收标准
- 依赖关系

### 3. 编译输出

编译成功后输出：

- 标准化 `TaskCard` 集合
- 当前 `Queue`
- 被拒绝或待细化的项

### 4. 编译策略

采用混合模式：

- 能安全细化的，PCP 自动细化
- 过于模糊的，PCP 拒绝装载
- 装载前可要求 agent 或用户确认

### 5. 编译校验项

PCP 至少检查：

- 粒度是否足够执行
- 是否有明显不可验证的描述
- 是否缺失关键依赖
- 是否存在已完成任务被重复装载
- 是否与当前活跃任务冲突

## 七、Queue 装载规则

Queue 是运行时弹夹，不是永久资产。

装载原则：

- 只装当前可执行的 TaskCard
- 遇到未满足的硬依赖，不应装载
- 软依赖可以提示，但不必阻塞
- 当前卡完成后，下一张 `ready` 卡自动补位

理想情况下 Queue 优先装载：

1. 无未满足硬依赖
2. 粒度足够执行
3. 已经被确认接受的卡

## 八、当前仓库与目标模型的映射

### 已有基础

- `stack.json` 已承担简化版 Queue
- `events.jsonl` 已承担 Event Log
- `pcp_plan` 已承担简化版计划装载
- `pcp_sub` 已承担简化版子任务机制
- `pcp_done` + `git commit` hook 已承担简化版自动推进

### 当前缺口

- 还没有独立持久化的 `TaskCard`
- 还没有独立持久化的 `Plan`
- `pcp_plan` 还不是正式“计划编译器”
- review / git / handoff 状态还未独立为并行字段
- 子任务与依赖关系还没有统一数据结构

## 九、实现顺序建议

如果后续进入开发阶段，建议顺序是：

1. 先做 `TaskCard` 持久化结构
2. 再做 `Plan` 持久化结构
3. 再把 `pcp_plan` 升级成正式计划编译器
4. 再补 `review_status / git_status / handoff_status`
5. 最后补 `intake` 和 Concern Log

## 十、与 Concern Log 的关系

Concern Log 不替代 TaskCard，也不替代 Backlog。它更像未来阶段的设计提醒池：

- 记录“现在先不实现，但做到某一步时必须重新讨论”的问题
- 在规划或进入特定实现阶段时再拉出来

因此 Concern Log 应建立在本文定义的对象模型之上，而不是先于 TaskCard / Plan Compilation 出现。
