# PCP Quickstart

这是一张给日常开发时看的短卡片。先不用记所有工具，只记主线流程。

## 最短主线

1. 接手项目或恢复上下文  
   用：`pcp_intake`

2. 把这一轮任务装进 PCP  
   用：`pcp_plan`

3. 随时看当前状态和下一步建议  
   用：`pcp_status`

4. 任务做完后先提交完成汇报  
   用：`pcp_done`

5. 如果有待 review 项，先统一看  
   用：`pcp_review`

6. 用户决定后，由 PCP 代执行  
   用：`pcp_review_apply`

这里最容易混的是：
- `pcp_done` = “我做完了，请进入审批”
- `pcp_review_apply` = “我已经决定了，你按这个审批结果去执行”

## 什么时候用 Blueprint

不是每个任务都要用。

只在复杂任务时考虑：
- 步骤明显很多
- 很容易把当前任务和后续任务做混
- 可能需要拆出子任务

这时：
- 先看 `pcp_status` 是否提示建议建 Blueprint
- 再决定要不要 `pcp_blueprint_create`

## 什么时候会出现 proposal

当 agent 觉得“后面可能还需要补一个任务/子任务”时，不会直接加正式任务，只会先生成 proposal。

这时你通常这样走：
- `pcp_review`
- 再 `pcp_review_apply`

## 只记这 6 个最常用命令

- `pcp_intake`
- `pcp_plan`
- `pcp_status`
- `pcp_done`
- `pcp_review`
- `pcp_review_apply`

## 一句话记忆版

`intake -> plan -> status -> do -> done -> review -> review_apply`
