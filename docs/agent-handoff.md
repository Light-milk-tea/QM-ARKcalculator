# QMcalculator Agent 接手文档

这份文件给后续 agent 快速接手 `QMcalculator` 用，目标是减少上下文消耗，并明确区分新项目与旧项目，避免误改仓库或混淆架构。

## 1. 先看这段：新老项目关系

### 1.1 两个项目是什么关系

- `QMcalculator` 是 **新项目**，位于 `/Users/mac/Desktop/ARKcalculator/QMcalculator`
- `ArknightCalculator` 是 **旧项目**，位于 `/Users/mac/Desktop/ARKcalculator/ArknightCalculator`
- 新项目是对旧项目的 **重构、翻新和拓展**，不是在旧项目里继续堆补丁
- 旧项目的主要价值是：
  - 提供已经验证过的大量 custom 规则知识
  - 提供旧版公式实现、回归思路、数据审计经验
  - 作为新项目迁移和对照的“知识库/参考实现”

### 1.2 默认工作原则

- 用户没有特别说明时，**默认工作对象是 `QMcalculator`**
- 用户提到“项目”“当前仓库”“新项目”“重构版”时，默认指 `QMcalculator`
- `ArknightCalculator` **默认只读**，用来查知识、对照规则、比对结果
- 除非用户明确要求修改旧项目，否则不要编辑 `ArknightCalculator`

### 1.3 一句话区分

- `QMcalculator`：未来要继续建设、发布、扩展的平台化新项目
- `ArknightCalculator`：历史积累丰富、但架构较旧的参考项目

## 2. 接手时的最低阅读顺序

新对话优先按下面顺序阅读，不要先扫全仓库。

1. 本文件：`docs/agent-handoff.md`
2. 项目总目标：`QMcalculator.md`
3. 新架构约束：`docs/architecture.md`
4. 中长期路线：`docs/roadmap/mid-long-term-project-plan.md`
5. 当前规则迁移状态：`docs/custom/custom-rule-status.md`

只有遇到下面情况，才继续读旧项目：

- 需要迁移某条 custom 规则
- 需要比对新旧结果差异
- 需要确认某个 blackboard key 在旧项目中的处理方式
- 需要了解旧项目已有的人工判定边界

这时再读：

1. `ArknightCalculator/docs/codex-handoff.md`
2. `ArknightCalculator/docs/custom-key-reference/00-阅读顺序与重要原则.txt`
3. 按需读 `01/02/03/04/05/06` 系列 custom 文档

## 3. 低上下文工作方式

- 先读文档，再读相关代码，不要先回顾历史聊天记录
- 如果用户只是提问、讨论或让你判断方向，先不要跑全量工具
- 搜索优先精确文件和关键词，不要一上来全仓库广泛扫描
- 小改动只验证相关范围；公式、数据流、脚本、CI 改动再跑全量门禁
- 不要贴大段 diff 或海量终端输出，只回报结论、文件和验证结果
- 如果只是为了理解新项目，优先读 `QMcalculator` 文档，不要先沉进旧项目实现细节

## 4. 新项目当前定位

### 4.1 项目目标

`QMcalculator` 目标不是简单复刻旧版页面，而是把项目升级成：

- 可解释的 DPS 计算器
- 有规则引擎和 warning 体系的计算内核
- 有数据同步、规则审计、版本快照、回滚能力的长期维护平台

### 4.2 当前阶段

- 当前阶段仍处于 `MVP-DPS` 路线
- 核心目标是单目标 DPS 闭环，不追求一次性覆盖所有复杂机制
- 非目标暂包括：
  - 治疗/HPS
  - 召唤物独立建模
  - 多目标模拟
  - 元素损伤混算

### 4.3 核心约束

- UI 不直接解析原始 blackboard
- 所有计算统一从 `calculateSkillDps()` 进入
- 遇到未知、歧义、部分覆盖语义时必须输出 `warnings`
- 结果优先保证正确、可追溯、可维护，不为了 UI 方便破坏分层

## 5. 新项目目录怎么理解

### 5.1 顶层结构

- `apps/web`：Vue 前端壳与交互层
- `packages/calc-core`：框架无关的计算内核
- `scripts`：数据同步、规则审计、文档生成、质量门禁、发布快照
- `docs`：架构、路线图、策略、规则状态等文档
- `versions`：数据版本、规则版本、发布快照

### 5.2 默认去哪改

- 改页面、交互、路由、状态：优先看 `apps/web`
- 改公式、规则归一化、结果结构：优先看 `packages/calc-core`
- 改数据同步、审计、发布流程：优先看 `scripts`
- 改项目规则说明、路线、策略：优先看 `docs`

### 5.3 不要优先改这些地方

- `apps/web/dist`：构建产物，默认不手改
- `packages/calc-core/dist`：构建产物，默认不手改
- `docs/custom/custom-rule-status.md`：由 `scripts/generate-custom-docs.mjs` 生成，除非确有必要，否则不要手工维护内容

## 6. 新项目与旧项目的架构差异

### 6.1 旧项目的特点

- React CRA 单体结构
- UI、状态、数据适配、公式实现耦合更深
- custom 规则和历史知识很多，但更多依赖既有代码链路和人工经验

### 6.2 新项目的特点

- Monorepo 结构
- `apps/web` 和 `packages/calc-core` 解耦
- 计算逻辑要独立于 UI
- 要显式产出 `warnings`、`ruleTrace`、版本信息、审计结果
- 更强调协议化规则系统，而不是散落式 custom 逻辑

### 6.3 迁移时要牢记

- 不要把旧项目代码“原样搬运”到新项目
- 要迁移的是：
  - 规则知识
  - 结果口径
  - 回归样例
  - 人工判定边界
- 不建议直接继承的是：
  - 旧组件结构
  - 与 UI 耦合的调用方式
  - 隐式链式规则逻辑

## 7. 当前最重要的文件

### 7.1 新项目核心文档

- `QMcalculator.md`：项目背景、核心计算过程与目标
- `docs/architecture.md`：新架构三层与核心约束
- `docs/roadmap/mid-long-term-project-plan.md`：中长期执行路径
- `docs/quality/quality-gate-v1.md`：质量门禁口径
- `docs/ops/release-rollback-strategy.md`：版本化发布与回滚策略
- `docs/custom/custom-rule-status.md`：当前规则迁移阶段状态

### 7.2 新项目重要代码位置

- `packages/calc-core/src/index.ts`：内核导出入口
- `packages/calc-core/src/pipeline.ts`：计算流水线入口
- `packages/calc-core/src/rules.ts`：规则归一化与规则应用主入口
- `packages/calc-core/src/phase1CustomRules.ts`：阶段 1 custom 规则
- `packages/calc-core/src/types.ts`：核心类型协议
- `packages/calc-core/src/warningCatalog.ts`：warning 定义
- `apps/web/src/composables/useCalculation.ts`：前端计算调用入口
- `apps/web/src/composables/useGameData.ts`：前端数据加载入口
- `apps/web/src/stores/`：前端状态管理
- `apps/web/src/pages/HomePage.vue`：当前页面主入口

### 7.3 旧项目参考入口

- `ArknightCalculator/docs/codex-handoff.md`
- `ArknightCalculator/docs/custom-key-reference/`
- `ArknightCalculator/src/model/SkillCalculator.js`
- `ArknightCalculator/src/model/DamageFormula.js`
- `ArknightCalculator/src/model/SkillTotalFormula.js`
- `ArknightCalculator/src/model/skillEffectRules.js`
- `ArknightCalculator/src/model/talentEffectRules.js`
- `ArknightCalculator/src/model/uniequipTraitRules.js`

## 8. 常见任务应该怎么切入

### 8.1 用户要改 UI

- 先读 `apps/web/src/pages/HomePage.vue`
- 再看相关 `stores`、`composables`、`router`
- 除非发现结果结构不够用，否则不要先去动 `calc-core`

### 8.2 用户要改计算逻辑

- 先看 `packages/calc-core/src/types.ts`
- 再看 `pipeline.ts`、`rules.ts`、相关规则文件
- 如涉及旧规则迁移，再去查 `ArknightCalculator` 的对应实现和 custom 文档

### 8.3 用户要迁移某条旧规则

- 先确认当前需求是改 **新项目**
- 在旧项目里查：
  - 对应规则代码
  - custom key 文档
  - 是否已有人工待复核说明
- 再在新项目里实现协议化规则，不要直接复制旧项目写法
- 实现后尽量补回归样例和 warning 行为校验

### 8.4 用户要查结果偏差

- 优先核对：
  - 新旧项目是否在同一养成参数下比较
  - 是否开启条件效果
  - 是否存在 warning
  - 是否属于尚未迁移或部分覆盖的规则
- 再看旧项目是否有特殊 custom、阶段口径或人工假设

### 8.5 用户要做数据或发布相关工作

- 先读 `docs/quality/quality-gate-v1.md`
- 再读 `docs/ops/release-rollback-strategy.md`
- 优先从根目录脚本入口执行，不要随意绕过既有统一命令

## 9. 常用命令

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

补充说明：

- `npm run dev`：启动 `apps/web`
- `npm run regression`：当前指向 `@qm/calc-core`
- `npm run quality:gate`：统一执行 typecheck、test、build、custom audit
- 如果改动的是公式、规则、数据脚本或发布流程，优先跑 `npm run quality:gate`

## 10. 当前阶段最该关注的事

- 先把单目标 DPS MVP 打稳
- 逐步迁移旧项目高价值规则，不追求一次性吃下所有长尾机制
- 用 `Top20` 优先队列建立新旧结果对照
- 确保 warning、ruleTrace、回归样例、质量门禁、版本快照一起运转

## 11. 已知容易混淆的点

### 11.1 最容易犯的错

- 把旧项目当成当前要直接修改的主仓库
- 看到老项目 custom 多，就直接沿用老项目耦合式结构
- 在新项目里为了省事，让 UI 直接读取 raw blackboard
- 只迁移“算出来”的逻辑，不迁移 warning、trace、测试和文档

### 11.2 必须明确的判断

- 如果用户没说“改旧项目”，就不要改 `ArknightCalculator`
- 如果需求涉及“现在这个重构版/新项目”，就只改 `QMcalculator`
- 如果新项目结果和旧项目不一致，旧项目只是参考基线，不必机械完全照搬；但任何差异都要能解释

## 12. 推荐的接手提示词

可以直接给后续 agent 这句：

> 请先阅读 `QMcalculator/docs/agent-handoff.md`，低上下文接手。默认工作对象是 `QMcalculator`，`ArknightCalculator` 仅作旧规则与结果对照参考；除非我明确要求，否则不要修改旧项目。

## 13. 项目进度快照（2026-07-02）

> 本节用于给后续 agent 提供“可执行证据级”的当前进度，不需要重新做一轮全仓扫描。

### 13.1 当前阶段判断

- 从可运行结果看，`MVP-DPS` 主链路已经可用，项目已不再是“纯规划阶段”
- 从规则迁移覆盖看，当前更接近“阶段1已形成闭环、阶段2首批迁移推进中”的状态
- 中长期路线图里的勾选项仍偏模板化，判断进度时应优先参考脚本输出、测试结果与版本文件

### 13.2 已落地能力（可直接复用）

- 计算内核主入口与关键模块已具备：`packages/calc-core/src/{index,pipeline,rules,phase1CustomRules,types,warningCatalog}.ts`
- Web MVP 主流程文件已具备：`apps/web/src/pages/HomePage.vue` + `composables/stores/components` 结构
- 质量门禁 v1 已串联：`scripts/quality-gate.mjs`（`sync:data -> typecheck -> test -> build -> audit:custom`）
- CI 已接入统一门禁：`.github/workflows/ci.yml`
- 版本与快照链路已存在：`versions/data-version.json`、`versions/rule-version.json`、`versions/releases/`

### 13.3 关键进度指标（最新可验证）

以下指标来自一次完整质量门禁执行与审计脚本输出：

- 质量门禁：`node scripts/quality-gate.mjs` 全部通过
- 测试通过：`@qm/calc-core` 共 `3` 个测试文件、`5` 个测试用例通过
- `Top20` 迁移：`ready=5`，`pending=15`（处于首批迁移早中期）
- Blackboard 覆盖率：`0.7617`（阈值 `>= 0.75`，已达标）
- 疑似需 custom 比例：`0.1776`（阈值 `<= 0.25`，已达标）
- 规则版本：`v0.1.0`，已包含 `4` 条 phase1 规则
- 数据版本：`20260702-1`，并已有首个 release snapshot

### 13.4 当前主要缺口（下一阶段重点）

- `Top20` 仍有 `15` 项 pending，阶段2核心任务仍是补齐高价值规则迁移与回归
- `docs/custom/custom-rule-status.md` 目前仍是“首批分类占位”，需要随着迁移进展持续生成和细化
- Web 侧自动化测试仍为空（当前 `web` 测试是 passWithNoTests），后续建议补最小交互回归
- 路线图文档里程碑未同步到实际完成度，建议每次阶段动作后更新勾选状态和偏差说明

### 13.5 接手后建议的首轮动作（低上下文）

1. 先跑：`node scripts/quality-gate.mjs`，确认本地基线
2. 再看：`packages/calc-core/__tests__/fixtures/top20-priority-cases.json`，按 pending 清单挑 1-2 条推进
3. 规则迁移完成后同步更新：
   - 回归样例（`top20` fixtures + 对应测试）
   - custom 状态文档（`npm run docs:custom`）
   - 必要 warning/ruleTrace 行为说明
4. 每完成一轮迁移，跑一次 `quality:gate` 并确认 `versions` 快照是否需要补档

