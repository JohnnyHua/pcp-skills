# PCP Runtime Implementation Roadmap

## 文档目的

本文把前四份 PCP 架构文档压缩成一个实际可执行的实现路线图。目标不是继续扩概念，而是回答：

- 下一步先做什么
- 为什么按这个顺序做
- 哪些已经完成
- 哪些先放 Concern Log
- 哪些后面再进入正式开发

## 一、当前状态

截至目前，PCP 已经具备一个可运行的 OpenCode 参考实现：

- OpenCode plugin runtime
- queue / backlog / pivot / history
- `PROJECT.md` / `WORKLOG.md`
- `pcp_handoff` 与 `HANDOFF.md`
- 本地校验脚本与 smoke test
- 四份架构文档

这意味着当前阶段不是“从零开始做 PCP”，而是：

> 从已有 OpenCode 参考实现出发，把它逐步升级为一套更稳定的开发流程控制架构。

## 二、实现原则

后续开发遵循以下原则：

1. 先补基础对象，再补高级能力
2. 先让 OpenCode runtime 跑稳，再谈多宿主适配
3. 先做标准化与编译，不和外部 planner 抢规划权
4. 新出现的未来问题，默认进入 Concern Log，除非明确放入 backlog
5. 用户体验应尽量无感，复杂性由 runtime 吃掉
6. 每个 sprint 的 `Open risks` 只作为本轮摘要；需要后续处理的项应在 sprint 结束时转入 backlog，并重新排优先级

## 三、阶段划分

### Phase 0：已完成基础

这一阶段已经完成：

- OpenCode 中的 queue / backlog / worklog / handoff 基础能力
- 初始 runtime 状态文件
- 基础 hook 自动推进
- PCP 定位与核心模型文档

该阶段的成果是：PCP 在 OpenCode 中已经证明“值得继续做”。

### Phase 1：TaskCard 基础层

目标：把当前简化 queue 状态升级为真正的持久化 TaskCard 体系。

优先项：

1. 设计 TaskCard 存储结构
2. 为 TaskCard 建立最小持久化目录/索引
3. 保持与现有 `stack.json` / `events.jsonl` 的兼容过渡
4. 明确父子任务与依赖关系的最小表达

完成标志：

- 可以持久化一张 TaskCard
- 可以引用子卡
- 可以表达基本硬/软依赖

### Phase 2：Plan Compilation

目标：把 `pcp_plan` 从“任务装载器”升级为“计划编译入口”。

优先项：

1. 设计 Plan 持久化结构
2. 设计编译输入/输出格式
3. 建立任务粒度校验
4. 建立“可自动细化 / 必须拒绝”的规则
5. 将编译结果装入 Queue

完成标志：

- 外部 agent 产出的 Plan 可以被标准化
- PCP 能把 Plan 编译成 TaskCard + Queue
- 模糊计划会被明确拒绝或标记待细化

### Phase 3：Lifecycle And Review

目标：把当前隐式流程沉淀为正式状态机。

优先项：

1. 引入 `lifecycle_status`
2. 引入 `review_status`
3. 引入 `git_status`
4. 把用户选择 `yes / no / skip` 落入 review gate
5. 统一“审查 -> git -> done -> auto-next”的推进规则

完成标志：

- review 和 git 不再只是 prompt 约定，而是正式状态流
- 自动推进逻辑与状态机一致

### Phase 4：Handoff And Intake

目标：把当前 handoff 能力升级为完整交接闭环。

优先项：

1. 给 handoff 增加更稳定的 PCP 语义层
2. 设计 intake 流程
3. 明确恢复时的事实源优先级
4. 记录接手事件

完成标志：

- handoff 不只是导出文档
- intake 可以把接手动作标准化

### Phase 5：Concern Log

目标：把“未来阶段提醒”从文档约定升级成正式机制。

优先项：

1. Concern Log 数据结构
2. tags 与触发条件
3. 与 TaskCard / Plan / Handoff 的关联方式
4. 进入某阶段时自动拉出相关 concern
5. 把 sprint `Open risks` 与 backlog 回顾流程接起来

完成标志：

- 架构担忧不会被遗忘
- 系统在进入相关阶段时能重新提醒用户和 agent
- 与 sprint review 的 backlog 重新排优先级流程打通

当前进度：

- 已完成最小 Concern 持久化对象与索引
- 已提供 `pcp_concern_capture` / `pcp_concern_list` / `pcp_concern_match`
- 自动触发、自动关闭、与 handoff/intake 的联动仍未实现

### Phase 6：Host Compatibility

目标：开始从 OpenCode 参考实现走向多宿主兼容。

优先项：

1. 整理 OpenCode 专属逻辑与 PCP 通用逻辑
2. 定义 Claude Code 适配边界
3. 处理 host policy 与 PCP workflow 的冲突
4. 保持 `/plan`、`/handoff` 等现有入口不冲突

完成标志：

- PCP 不再和 OpenCode runtime 强耦合
- Claude Code 适配具备明确切入点

## 四、现在先不做的内容

以下方向有价值，但不应抢在核心对象层之前实现：

- 把“规划 + plan”进一步并进 PCP，形成更强自循环
- 独立的测试/审核子系统
- 项目完成后的技术总结归档系统
- 多宿主统一入口层
- hook / runtime 调试日志与解释层
- Delivery Bundle 的“专业版 / 中文口语版”双模板
- 更厚的人审 / 机审 gate 和产物预览层

这些内容应先进入 Concern Log 或 backlog，等基础 runtime 稳定后再进入开发。

## 五、当前 Concern Log 新增项

在本轮讨论中新增的未来关注点：

1. 后续是否把“规划 + plan”融合进 PCP，让系统更自循环
2. 是否补一个更独立的测试/审核环节，而不只是 review gate
3. 是否增加 hook / runtime 调试日志与解释层，让 AI 能把触发原因和执行路径解释给用户看

这两项当前不进入立即开发，先作为 Concern Log 保留。

## 六、建议的近期执行顺序

如果下一步进入真正实现，建议顺序严格保持为：

1. `TaskCard` 持久化
2. `Plan` 持久化与编译
3. Lifecycle / review / git 状态机
4. Handoff / Intake
5. Concern Log 机制
6. Claude Code / 多宿主适配

## 七、你现在在走的逻辑

当前这轮工作不是“只写文档”，而是在做 PCP 的架构收敛：

- 先把定位写清
- 再把对象和流程写清
- 再把 schema 与编译规则写清
- 再把 concern / handoff / compatibility 写清
- 最后压成实现路线图

这样进入开发时，就不是边写边想，而是沿着已经验证过的架构逐层落地。

## 八、进入开发后的工作方式

进入开发后，文档不会停止，而会变成 append-only 的设计与决策基线：

- 新需求继续追加
- 新 concern 继续登记
- 每轮 `Open risks` 需要决定是转入 backlog、转入 concern，还是当轮关闭
- 发现边界问题继续修正
- 但不再每次从零讨论 PCP 是什么

也就是说，后续我会继续帮你写：

- 开发流程
- schema
- 状态机
- runtime 设计
- 实现顺序
- 具体落地代码变更

文档和代码会同步推进，而不是二选一。
