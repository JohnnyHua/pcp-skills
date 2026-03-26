# PCP 收缩决议

## 一、结论

PCP 作为独立 runtime / orchestration 插件，进入收缩阶段。  
原因不是“想法完全错误”，而是：

- 实际开发中，`ohmyopencode` 已覆盖大部分日常使用价值
- PCP 在真实工作流里没有成为高频入口
- 很多约束更适合落到 `AGENTS.md`、`PROJECT.md` 和项目方法论，而不是继续做一个独立控制平面

所以后续方向从：

- 继续扩展 PCP runtime

调整为：

- 停止把 PCP 当作独立产品推进
- 保留其中真正有价值的方法论和基线设计
- 将能下放的能力下放到宿主工具、项目文档和协作规则

## 二、这次收缩保留什么

### 1. 方法论

这些内容仍然有价值，应保留：

- 模块 -> 功能 -> 接口 的拆分方式
- 复杂任务先做 Blueprint 的思路
- backlog / concern / worklog / changelog 的职责区分
- intake 先对齐认知，不自动开工
- handoff 只用于显式跨工具交接，不用于日常上下文压缩

### 2. 项目基线

这些内容更适合作为项目长期基线存在：

- `PROJECT.md`
- 版本路线图
- 项目约束
- 当前状态摘要

### 3. 参考实现

PCP 现有代码不必立刻删除，但后续应降级为：

- 实验性参考实现
- 架构探索记录
- 可回顾的 agent workflow 样例

而不是继续作为“主产品”投入开发。

## 三、这次收缩放弃什么

以下方向不再作为当前主线推进：

- 继续扩展 PCP runtime 对象层
- 把更多开发规范强行做进插件逻辑
- 把日常上下文管理建立在 handoff 上
- 继续围绕 review / intake / proposal 细节打磨更多命令

一句话：

> PCP 不再继续做“站在宿主之上的独立控制平面产品”。

## 四、替代方案判断

根据当前实际使用情况，PCP 被替代的主路径已经比较明确。

### 首选替代：Oh My OpenCode

当前最接近完整替代 PCP 的，是 `ohmyopencode`。

原因：

- 已经提供 plan builder / plan executor
- 更贴近日常真实开发入口
- 与 OpenCode 宿主结合更自然
- 你已经在真实开发里持续使用它，而不是 PCP

参考：

- Oh My OpenCode: https://ohmyopencode.com/
- OpenCode: https://opencode.ai/

### 宿主级替代

以下宿主能力，也覆盖了 PCP 原本想解决的一部分问题：

- OpenCode
  - 多模型、并行 session、本地工作流、hooks 与插件生态
- Claude Code
  - 强代码库理解、终端原生开发、从描述到提交的一体化工作流
- Codex / GitHub 集成方向
  - 更强的结构化代码执行和任务代理能力

参考：

- Claude Code: https://docs.anthropic.com/en/docs/claude-code/overview
- OpenAI Codex / GitHub Docs: https://docs.github.com/en/copilot/concepts/agents/openai-codex

### 文档与规则级替代

还有一类内容根本不需要 runtime：

- 开发规范写入 `AGENTS.md`
- 项目目标与版本路线写入 `PROJECT.md`
- 接口化拆分作为项目方法论长期使用

这类替代方式更轻，也更贴近你的真实工作流。

## 五、收缩后的新定位

PCP 后续更适合被重新描述成：

> 一套从 agent 架构实验中提炼出来的开发方法论与项目基线设计，而不是一个继续独立扩展的 orchestration 产品。

也就是说，保留：

- 架构探索价值
- 方法论价值
- 文档资产

暂停：

- runtime 产品化推进

## 六、建议的收尾动作

### Phase A：先停开发

- 停止继续做 PCP runtime 新功能
- 明确 README 与版本基线中的项目状态

### Phase B：改写定位

- README 改成“实验归档 / 方法论沉淀”定位
- 在版本基线中标注 PCP runtime 已暂停推进

### Phase C：保留精华

- 提炼接口化拆分方法
- 提炼 `PROJECT.md` 基线思路
- 提炼对 handoff / intake / backlog / concern 的认知

## 八、未收口实验的处理

这次收缩同时确认：

- 未完成的 `task_kind = interface | integration` runtime 改动，不继续推进
- 相关未提交代码与设计草稿从当前主线清出
- 其价值保留为方法论结论：
  - 模块 -> 功能 -> 接口 的拆分方式是有用的
  - 但不再优先做成 PCP runtime 功能

## 七、当前建议

当前建议采用：

- 先做收尾与定位调整
- 不再继续实现 PCP runtime 新能力
- 后续如有必要，只把真正不可替代的部分重新抽出来复用
