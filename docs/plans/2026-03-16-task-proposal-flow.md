# 2026-03-16 Task Proposal Flow

## 目标

增加显式的提议到批准流程，让 agent 只能提出后续任务建议，不能直接把建议塞进正式队列。

## 本轮范围

- 增加独立的 `TaskProposalRecord`
- 增加 `.opencode/pcp/proposals/*.json` 和 `index.json`
- 支持记录任务提议
- 支持批准提议并转成正式任务
- 支持拒绝提议且不影响现有队列

## 明确不做

- 提议自动触发
- 提议与 Blueprint 自动联动
- 提议批量批准
- `pcp_sub` 的审批语义

## 验收标准

- 任务提议不会直接生成 T 任务
- 用户批准后才会转成正式任务并入队
- 用户拒绝后只保留提议记录，不改变当前 queue
- `npm run check` 通过
