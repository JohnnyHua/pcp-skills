# 2026-03-16 Status Action Hints

## 目标

让 `pcp_status` 不只是显示当前状态，还能提示“现在最该做什么”，降低日常使用时忘记下一步动作的概率。

## 本轮范围

- 增加状态层 helper，集中判断 action hints
- `pcp_status` 展示：
  - 待批准完成时的下一步
  - 待批准 proposal 时的下一步
  - 复杂任务但未建 Blueprint 时的下一步
  - 没有 active task 时该先 `pcp_plan` 还是先看队列
- 为这些规则补最小自动化测试

## 明确不做

- 不新增 UI
- 不新增自动执行
- 不改变审批流语义
- 不把 hints 变成强制流程

## 完成标准

- `pcp_status` 输出里出现“下一步建议”
- 待批准完成优先提示 `pcp_approve`
- 待批准 proposal 优先提示 `pcp_list_task_proposals`
- 复杂 doing 任务但未建 Blueprint 时提示 `pcp_blueprint_create`
