# 2026-03-16 Blueprint Subtask Bridge

## 目标

在不破坏“正式任务与子任务都必须审批”这条硬规则的前提下，为 `Blueprint` 增加一条最小桥接能力：用户或 agent 可以手动从当前蓝图的某一步生成一个 `subtask proposal`。

## 本轮范围

- `Blueprint` 继续作为当前任务的执行大纲
- 增加“从 Blueprint 第 N 步生成子任务提议”的最小入口
- proposal 自动记录来源：
  - `source_blueprint_id`
  - `source_step_index`
- `pcp_status` 在复杂 doing 任务且尚未绑定 Blueprint 时给出建议提示

## 明确不做

- 不自动创建 Blueprint
- 不自动生成 Blueprint 草稿
- 不自动把 Blueprint 的所有步骤转成子任务
- 不自动批准 proposal
- 不把 Blueprint 和 backlog / concern 混在一起

## 设计原则

- `Blueprint` 是执行结构，不是任务列表
- 只有当某一步复杂到值得单独跟踪时，才从 Blueprint 提升为 `subtask proposal`
- Proposal 只是候选项，批准后才变成真正的 `sub` 任务
- Blueprint 建议是半自动提示，不强制、不自动展开

## 完成标准

- 可以从当前 active Blueprint 的指定步骤生成 `subtask proposal`
- proposal 保持 `proposed`，不会直接生成正式子任务
- proposal 列表能显示 Blueprint 来源
- 复杂任务但未绑定 Blueprint 时，`pcp_status` 能给出建议提示
