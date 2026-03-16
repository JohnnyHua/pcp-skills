# 2026-03-16 Proposal Review UX

## 目标

让待批准的 task/subtask proposal 更容易被看见和 review，避免它们在日常开发中被遗忘。

## 本轮范围

- `pcp_status` 显示待批准 proposal 数量
- `pcp_status` 标出其中有多少是 subtask proposal
- `pcp_list_task_proposals` 按待批准优先排序
- `pcp_list_task_proposals` 显示 proposal 类型与父任务信息

## 明确不做

- proposal 批量批准
- proposal 专门的 UI
- 自动弹窗式提醒

## 验收标准

- `pcp_status` 能看出当前是否有待批准 proposal
- proposal 列表优先显示待批准项
- 子任务 proposal 一眼能看出属于哪个父任务
- `npm run check` 通过
