# QMcalculator Agent 接手文档

这份文档用于帮助 agent 低上下文接手 `QMcalculator`，目标是快速进入可执行状态，并保持实现风格与工程约束一致。

## 1. 接手阅读顺序

1. `docs/agent-handoff.md`（本文件）
2. `docs/README.md`（文档索引）
3. `docs/项目进度.md`（分步执行清单与当前进度）
4. `docs/roadmap/completion-engineering-code-plan.md`（完工蓝图）
5. `docs/custom/custom-rule-status.md`（当前规则覆盖状态）

## 2. 工作边界

- 默认只在 `QMcalculator` 内工作，不跨仓库修改。
- UI 不承载公式逻辑，计算统一走 `@qm/calc-core`。
- 所有计算入口统一为 `calculateSkillDps()`。
- 遇到未知或歧义语义，必须通过 `warnings` 显式暴露风险。

## 3. 目录与职责

- `apps/web`：页面、交互、路由、状态管理。
- `packages/calc-core`：公式、规则引擎、数据归一化、结果结构。
- `scripts`：数据同步、审计、文档生成、质量门禁、发布快照。
- `docs`：架构、策略、路线图、运维说明。
- `versions`：数据版本、规则版本、发布快照。

## 4. 常见任务切入点

### 4.1 改 UI 或交互

- 先看 `apps/web/src/pages/HomePage.vue`
- 再看 `apps/web/src/components/` 与 `apps/web/src/stores/`
- 如无必要，不改 `calc-core` 协议

### 4.2 改计算逻辑

- 先看 `packages/calc-core/src/types.ts`
- 再看 `pipeline.ts`、`rules.ts`、`phase1CustomRules.ts`
- 变更后补对应回归测试与 warning 断言

### 4.3 改数据/脚本/发布流程

- 先看 `docs/quality/quality-gate-v1.md`
- 再看 `docs/ops/release-rollback-strategy.md`
- 优先使用根目录脚本入口，不绕过统一命令

## 5. 常用命令

在 `QMcalculator` 根目录执行：

```bash
npm run dev
npm run typecheck
npm run test
npm run build
npm run regression
npm run sync:data
npm run audit:custom
npm run docs:custom
npm run quality:gate
npm run release:snapshot
```

说明：

- 公式、规则、数据脚本、发布流程改动后，优先跑 `npm run quality:gate`。
- 修改规则后建议补充对应回归样例并检查 warning 变化。

## 6. 当前阶段关注点

- 打稳单目标 DPS 主链路与可解释性输出。
- 按 Top20 优先技能持续补齐规则覆盖。
- 保持 warning、ruleTrace、回归样例与门禁同步更新。
- 版本快照与发布记录保持可追溯。

## 7. 接手提示词（可复用）

> 请按 `docs/agent-handoff.md` 的阅读顺序低上下文接手；默认只修改 `QMcalculator`，并保持计算逻辑集中在 `@qm/calc-core`。
