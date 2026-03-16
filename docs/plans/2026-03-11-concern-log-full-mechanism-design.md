# Concern Log 完整机制蓝图

**目标：** 先把 PCP 中 `Concern Log` 的完整形态讲清楚，这样下一轮做“最小可用版本”时不会把未来扩展路线堵死。

**状态：** 本文档只定义设计蓝图，不直接改变当前运行时行为。

---

## 1. 为什么需要 Concern Log

`Concern Log` 不是 backlog，也不是任务队列。

它存在的意义是记录这类东西：

- 未来某个阶段必须重新讨论的问题
- 架构边界
- 兼容性风险
- 到达某个触发点时必须再次提醒的事项

它回答的问题是：

> 当 PCP 进入某个阶段时，哪些问题必须重新拿出来讨论？

这和 backlog 不一样。backlog 回答的是：

> 以后还要做哪些功能？

## 2. 它在 PCP 里的位置

PCP 以后应该逐步形成 4 层清晰分工：

- `Plan`
  - 规划阶段产出的任务集合
- `Task`
  - 从 plan 标准化出来的可执行目标
- `Blueprint`
  - 某个复杂任务进入 `doing` 后，它当前的执行展开图
- `Concern Log`
  - 未来某个阶段必须重新讨论的提醒池

这 4 层分别回答：

- `Task`：要做什么
- `Blueprint`：这个任务这次准备怎么做
- `Backlog`：以后还要做什么功能
- `Concern Log`：以后做到某一步时，哪些问题必须再讨论

## 3. Concern 对象应该长什么样

完整形态下，一条 Concern 最好包含这些字段：

- `id`
- `title`
- `detail`
- `tags`
- `status`
- `source`
- `created_at`
- `updated_at`
- `related_task_id`
- `related_plan_id`
- `related_blueprint_id`
- `related_artifact`
- `resolution_note`

### 第一版最小实现必须有的字段

- `id`
- `title`
- `detail`
- `tags`
- `status`
- `created_at`

### 建议的状态模型

- `open`
- `acknowledged`
- `triggered`
- `resolved`
- `dismissed`

## 4. Tag 机制

`Concern Log` 真正有用的关键，在于 `tags`。

完整机制里，至少应该支持这些标签前缀：

- `phase:*`
- `task:*`
- `artifact:*`
- `host:*`
- `hook:*`
- `review:*`
- `handoff:*`
- `intake:*`

例如：

- `phase:hook`
- `artifact:handoff`
- `host:claude-code`
- `review:gate`

除此之外，还应允许更内容型的语义标签，例如：

- `architecture`
- `language:zh`
- `user-intent`
- `login`
- `auth`

也就是说，Concern 的 tags 不应该只有“系统阶段标签”，还应该有“问题内容标签”。

后续 PCP 在进入某个阶段、处理某个对象、进入某个宿主路径时，就可以用这些 tags 去匹配相关 concern。

匹配规则也不应要求“全量精确匹配”。更合理的是：

- 命中 1 个关键 tag，就可以判定“相关”
- 命中越多，相关度越高
- 后续可以按命中数做排序，而不是只做布尔判断

## 5. 触发机制

完整机制里，Concern 不应该永远躺在那里，而应该在正确时机被重新拉出来。

未来触发源至少包括：

- 进入某个实现阶段
- 某个任务进入 `doing`
- 某个任务绑定或更新 blueprint
- 生成 handoff
- 执行 intake
- 进入某个宿主特定路径
- 进入 sprint review

理想行为是：

1. 当前运行时生成一组上下文 tags
2. PCP 用这些 tags 去匹配 Concern
3. 命中的 Concern 被简短提示出来
4. 用户或 agent 再决定现在要不要展开讨论

## 6. Concern 和 Blueprint 的关系

`Concern Log` 不能代替 blueprint。

对于一个复杂任务，应该是这样：

- 任务进入 `doing`
- 这个任务绑定一个当前 blueprint
- blueprint 负责说明这个任务内部准备怎么展开
- blueprint 之外溢出来的东西，再分成两类：
  - 以后明确要做的功能 -> `Backlog`
  - 以后必须重新判断的问题 -> `Concern Log`

例如：

- 当前任务：`实现 A`
- 当前 blueprint：
  - 第一步做 A 骨架
  - 第二步做 A 肌肉
  - 第三步做 A 皮毛
- backlog：
  - `美化 A`
- concern：
  - `A 和 B 日后可能冲突`

所以：

- `Blueprint` 是当前任务的执行展开图
- `Concern Log` 是当前任务外溢出的未来决策提醒

## 7. Concern 和 Handoff / Intake 的关系

后续 Concern Log 应该和 handoff/intake 发生两种联动：

- handoff 里带出当前相关 concern 摘要
- intake 时重新检查与当前恢复状态匹配的 concern

但这不属于第一版实现。

第一版不做：

- merge 策略
- 冲突处理
- branch/commit 对比
- completed-summary 对比

这些属于 handoff/intake 后续增强，不是 Concern 最小机制的前置条件。

## 8. 下一轮最小实现边界

下一轮真正要做的最小版本，应该故意收窄，只做：

- Concern 持久化对象
- Concern 索引
- tag 匹配能力
- 最小 capture / list / match 流程

下一轮先不做：

- 自动触发执行
- 自动关闭 concern
- 强制绑定 task / blueprint
- handoff 冲突处理
- git-aware 对比逻辑

## 9. 后续扩展顺序

Concern Log 完整机制建议后续按这个顺序长出来：

1. 先有持久化 Concern 对象
2. 再有 tag 匹配 API
3. 再接入几个关键 PCP 阶段触发点
4. 再把 concern 摘要挂进 handoff/intake
5. 最后再做 resolution 流程
6. 再往后才考虑跨宿主冲突处理

## 10. 当前明确延后的内容

下面这些现在仍然有效，但它们不属于 Concern 机制本体，而是：

- 应该作为 Concern 条目记录的未来问题
- 或者应该进入 backlog 的未来功能

它们不应该抢进下一轮最小 Concern 实现：

- handoff 里的 `branch / commit / pcp version / completed summary`
- 更丰富的 review 产物预览
- `Delivery Bundle` 的双模板系统
- hook/runtime 的解释层

这些内容不是错，也不是不做，而是现在不该插队。

## 11. 当前蓝图结论

所以当前最合理的推进方式是：

1. 先把 `Concern Log` 完整蓝图写清楚
2. 再做最小 Concern 机制
3. 之后再慢慢接到 handoff/intake、hook、review、host compatibility 上

这样既不会丢掉未来路线，也不会让当前 sprint 因为 scope 膨胀而失控。
