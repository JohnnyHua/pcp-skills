# PCP 版本基线

## 文档目的

这份文档不是功能 backlog，而是 PCP 自己的版本基线。  
它回答的是：

- PCP 现在处于哪一版
- 这一版的目标是什么
- 哪些能力属于当前版本必须完成
- 哪些能力应该推到下一版

PCP 后续的开发、取舍和“先做哪个”都应该优先参考这份版本基线，而不是只看零散 backlog。

## 一、为什么版本基线要进入 PCP

PCP 不只是任务系统，它更像一个站在开发旁边的流程调度者：

- 当前应该做什么
- 哪些不属于这一版
- 哪些先记进 backlog
- 哪些属于未来阶段再讨论的问题

要做到这一点，PCP 自己也需要一个稳定的“版本视角”。

所以版本路线图不是 README 附录，也不是临时计划，而应该视为 `Project Baseline` 的组成部分。

## 二、版本基线与其他记录的关系

- `Version Baseline`
  - 管当前版本目标与阶段边界
- `Task / Queue`
  - 管当前执行
- `Backlog`
  - 管以后要做但不属于当前版本必须完成的功能
- `Concern Log`
  - 管未来某阶段必须重新讨论的问题
- `Worklog`
  - 管过程
- `Changelog`
  - 管结果

一句话区分：

- 版本基线决定“现在这版先做什么”
- backlog 记录“以后还能做什么”
- concern 记录“以后还要重新想什么”

## 三、当前版本草案

### v0：OpenCode 单人可用主干

目标：
- 让 PCP 在单人、单目录、OpenCode 场景中真正可用

这一版必须完成的能力：
- `pcp_intake`
- `pcp_intake_adopt`
- `pcp_plan`
- `TaskCard / Queue`
- `pcp_done`
- `pcp_review`
- `pcp_review_apply`
- proposal / subtask approval
- backlog / concern
- handoff / intake 基础闭环
- Blueprint 复杂任务支持
- quickstart / status hints

当前判断：
- PCP 现在已经非常接近 `v0`
- 剩下的重点不再是“缺主干对象”，而是“接手后到执行前的最后一段顺滑度”

### v0.1：使用体验收口

目标：
- 让这套主干真正能天天用，而不是“功能都有但容易忘”

优先方向：
- intake follow-up
- 更顺的接手问答
- 更好的 drill-down 入口
- 项目基线刷新策略
- review / status / intake 的文案与操作收口
- 降低 hook 日志噪音，例如重复出现的 `no approved task to auto-start`

这一版的重点不是加很多新对象，而是让已有主干不别扭。

### v0.2：跨工具接力增强

目标：
- 让 handoff / intake 在跨工具切换时更稳

优先方向：
- handoff 语义增强
- branch / commit / completed summary
- intake 冲突判断
- 更明确的事实源优先级

### v0.3：更智能的流程层

目标：
- 在不破坏稳定性的前提下，让 PCP 更聪明

优先方向：
- semantic intent
- 更强的 hook / runtime 调试解释
- 多宿主适配

## 四、当前版本判断

当前建议把 PCP 定位在：

> `v0 收尾阶段，开始进入 v0.1 的体验收口`

原因：
- 核心主干已经基本齐了
- 现在更大的问题不是“没有这个能力”
- 而是“进入项目后如何自然接手、解释、提问、再开始”

所以后续一段时间，如果没有特别强的理由，不建议再大幅扩对象层，而应优先：

1. 收口 `v0`
2. 顺滑进入 `v0.1`

## 五、版本基线使用规则

后续讨论功能时，优先先问：

1. 这个功能属于哪一版？
2. 它是不是当前版本必须完成？
3. 如果不是，应该进 backlog 还是 concern？

只有这样，PCP 才能像一个真正的流程调度者，而不是继续把所有想法平铺在 backlog 里。

## 六、2026-03-26 状态修正

经过一周左右的真实使用，当前结论需要修正：

- PCP 作为独立 runtime / orchestration 产品，并没有进入日常主工作流
- `ohmyopencode` 已覆盖大部分实际需要的 plan / execute 场景
- 很多约束更适合下放到 `AGENTS.md`、`PROJECT.md` 和项目方法论，而不是继续做成插件逻辑

因此当前状态建议更新为：

> PCP runtime 进入收缩阶段，停止继续作为主产品扩展；保留方法论、项目基线和实验参考价值。

相关收缩决议见：

- [PCP 收缩决议](../plans/2026-03-26-pcp-sunset-design.md)

## 七、项目基线文件的位置

版本基线虽然已经单独写在这份文档里，但后续应进入更稳定的 `PROJECT.md`：

- `PROJECT.md`
  - 项目是什么
  - 当前架构概况
  - 当前版本路线图
  - 当前版本状态
  - 项目约束

这样版本基线就不只是架构文档的一部分，而会成为 PCP intake 和后续流程判断可直接读取的项目基线。
