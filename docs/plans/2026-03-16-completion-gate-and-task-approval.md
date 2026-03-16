# 2026-03-16 Completion Gate And Task Approval

## 目标

修复 PCP 的两个流程风险：

1. 正式任务完成后不应无条件自动推进
2. PCP runtime 不应在没有已批准任务时自动创建新的主线任务

## 本轮范围

- 增加 `completion_mode`
  - `gated`
  - `auto`
- 在 `gated` 模式下：
  - `pcp_done` 只提交完成汇报
  - `git commit` 只标记待批准完成
  - 只有 `pcp_approve` 才推进到下一个任务
- 禁止 runtime 在没有活动任务且没有 ready queue 时自动创建主线任务

## 明确不做

- 任务提议机制
- `pcp_sub` 的审批流
- Blueprint skeleton
- 更复杂的 review gate

## 验收标准

- `gated` 模式下任务不会直接推进
- `pcp_approve` 可以恢复原有队列推进
- `auto` 模式保持兼容
- 全量测试通过
