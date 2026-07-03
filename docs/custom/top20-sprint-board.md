# Top20 本周迁移看板（7天启动）

## 范围冻结

本周锁定以下 3 个技能做迁移闭环：

1. `char_010_chen / skchr_chen_2`（陈 S2 赤霄·拔刀）
2. `char_4039_horn / skchr_horn_3`（号角 S3 终曲）
3. `char_1028_texas2 / skchr_texas2_3`（缄默德克萨斯 S3 剑雨滂沱）

## 映射表

| 技能 | 规则点 | 预期 warning | 回归断言 |
|---|---|---|---|
| 陈 S2 | 瞬发技能按 `max_target` 建立攻击次数，修正 burst 排程 | 允许 `WARN_ASSUMPTION_APPLIED`；不应出现崩溃 | `summary` 数值稳定、`formula.schedule` 非空 |
| 号角 S3 | `conditionEnabled=true` 启用过载修正（攻速/攻击加成） | 若存在未映射 key，保留 `WARN_UNMAPPED_KEY` | 条件开关下 `dps` 方向性差异正确 |
| 缄默德克萨斯 S3 | 主流 + 额外流拆分（新增 `OTHER_TRUE`） | 可保留 `WARN_PARTIAL_RULE_COVERAGE` 作为阶段提示 | `streams` 包含 `MAIN` 与 `OTHER_TRUE` |

## 完成标准

- 每个技能都具备可执行 fixture（含 `operatorId/skillId`）
- 每个技能都有规则命中与回归断言
- 每日门禁 `npm run quality:gate` 保持全绿
