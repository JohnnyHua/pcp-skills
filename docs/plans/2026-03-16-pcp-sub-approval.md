# 2026-03-16 PCP Sub Approval

## 目标

把 `pcp_sub` 纳入正式审批流，避免临时子任务成为绕过 proposal/approval 规则的后门。

## 本轮范围

- `pcp_sub` 不再直接创建子任务
- `pcp_sub` 改为创建 `subtask` 类型的 proposal
- 批准 `subtask` proposal 后，才真正压栈并创建 `sub` 任务

## 明确不做

- 子任务提议批量批准
- 子任务提议的专门 UI
- Blueprint 自动拆成子任务

## 验收标准

- `pcp_sub` 默认只产生提议，不直接产生 `T` 子任务
- 批准 `subtask` proposal 后，才会把子任务压到当前主线之上
- `npm run check` 通过
