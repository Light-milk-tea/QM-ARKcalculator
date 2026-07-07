# QMcalculator

`QMcalculator` 是一个面向明日方舟技能伤害分析的独立工程项目，目标是提供可解释、可回归、可发布的计算能力。

## 项目能力

- 单目标 DPS 计算主链路（`summary / schedule / streams`）
- 规则引擎驱动的技能语义处理（`ruleTrace`）
- 风险显式化提示（`warnings`）
- 数据同步、规则审计、文档生成、质量门禁与发布快照

## 技术栈与结构

- Monorepo（npm workspaces）
- 前端：`apps/web`（Vue + Vite）
- 计算内核：`packages/calc-core`（TypeScript）
- 工程脚本：`scripts`
- 版本与快照：`versions`
- 文档：`docs`

## 快速开始

```bash
# 1) 安装依赖
npm install

# 2) 启动前端开发环境
npm run dev
```

## 常用命令

```bash
# 代码质量与验证
npm run typecheck
npm run test
npm run regression
npm run build
npm run quality:gate

# 数据与规则文档
npm run sync:data
npm run audit:custom
npm run docs:custom

# 发布与回滚
npm run release:snapshot
npm run release:verify
npm run release:rollback
```

## 推荐工作流

1. 变更代码后先跑 `npm run test`
2. 涉及规则、数据或核心逻辑时跑 `npm run quality:gate`
3. 调整规则文档后执行 `npm run docs:custom`

## 目录速览

```text
QMcalculator/
├─ apps/web/                  # 页面与交互
├─ packages/calc-core/        # 计算内核与测试
├─ scripts/                   # 数据、审计、门禁、发布脚本
├─ versions/                  # data/rule/release 版本快照
└─ docs/                      # 项目文档
```

## 文档入口

- 项目文档索引：`docs/README.md`
- 质量门禁：`docs/quality/quality-gate-v1.md`
- 发布与回滚：`docs/ops/release-rollback-strategy.md`
- 规则状态：`docs/custom/custom-rule-status.md`

## 许可证

当前仓库未单独声明开源许可证；如需对外发布，请先补充 `LICENSE` 文件。
