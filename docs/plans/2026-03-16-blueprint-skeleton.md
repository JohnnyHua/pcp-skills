# 2026-03-16 Blueprint Skeleton

## 目标

为当前 `doing` 任务增加最小 Blueprint 骨架，让复杂任务可以挂一份当前执行展开图，而不把后续 backlog 或 concern 直接混进任务本体。

## 本轮范围

- 增加独立的 `BlueprintRecord`
- 增加 `.opencode/pcp/blueprints/*.json` 和 `index.json`
- 让 `TaskCard` 挂 `current_blueprint_id`
- 支持为当前 `doing` 任务创建和查看 Blueprint
- 如果同一任务重复创建 Blueprint，旧 Blueprint 归档，新 Blueprint 成为当前版本

## 明确不做

- 自动从 Blueprint 生成子任务
- 自动联动 backlog / concern
- 多任务共享 Blueprint
- handoff 自动带 Blueprint 摘要

## 验收标准

- 当前活动任务可以绑定一个 Blueprint
- Blueprint 独立持久化，不影响 backlog/queue
- 重建 TaskCard 后仍能保留 `current_blueprint_id`
- `npm run check` 通过
