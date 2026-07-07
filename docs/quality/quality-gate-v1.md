# 质量门禁 v1（Quality Gate v1）

## 门禁目标

- 保证每次规则迭代不会破坏基础可用性。
- 将本地验证流程与 CI 流程统一。

## 门禁步骤

0. Sync Data：`npm run sync:data`（可选前置；本地做数据更新时必须执行）
1. Typecheck：`npm run typecheck`
2. Unit/Regression：`npm run test`
3. Build：`npm run build`
4. Custom Audit：`npm run audit:custom`

当前阶段附加阈值（由 `audit:custom` 校验）：

- `blackboardCoverage >= 0.75`
- `likelyCustomRatio <= 0.25`
- `readyTop20 >= 12`（可通过 `MIN_READY_TOP20` 环境变量临时覆盖）

统一入口：`npm run quality:gate`

## 失败处理策略

- 任一步骤失败即终止，不允许带风险合入。
- 修复后必须重新执行全量门禁，不只重跑单步。
- 若为数据变更引入告警，应同步更新审计记录与规则文档。
- `audit:custom` 不仅输出统计，也会在关键阈值不达标时返回非 0 退出码。

## 与 CI 对齐

- CI 工作流定义：`.github/workflows/ci.yml`
- CI 执行 `npm run quality:gate` 并设置 `SKIP_QUALITY_SYNC=true`（跳过 `sync:data`）。
- 建议在涉及 JSON 数据更新的 PR 中，本地先执行一次 `npm run sync:data`，再跑 `npm run quality:gate`。
- 非数据变更场景下，本地与 CI 都可直接使用 `npm run quality:gate`。

## 版本范围

- 本文档为 v1，覆盖 MVP-DPS 阶段。
- 后续增强方向：
  - docs consistency 检查
  - Top20 样例覆盖率阈值检查
  - 差异报告自动归档
