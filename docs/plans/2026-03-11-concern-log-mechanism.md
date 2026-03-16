# 2026-03-11 Concern Log 最小机制

## 目标

把 `Concern Log` 从文档概念落成最小可用 runtime，先支持记录、列出、按 tags 匹配，不在本轮实现自动触发。

## 本轮范围

1. 增加 Concern 持久化对象
2. 增加 Concern 索引
3. 增加 tags 匹配能力
4. 暴露最小 PCP 工具入口：
   - `pcp_concern_capture`
   - `pcp_concern_list`
   - `pcp_concern_match`

## 明确不做

- 自动触发 concern
- 自动关闭 concern
- 与 handoff/intake 的冲突联动
- `branch / commit / completed summary` 对比

## 验收标准

- 可以生成 `.opencode/pcp/concerns/C001.json`
- 可以生成 `.opencode/pcp/concerns/index.json`
- 可以按部分 tag 命中返回 concern，并按命中数排序
- `npm run check` 通过
