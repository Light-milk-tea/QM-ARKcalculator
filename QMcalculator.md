# QMcalculator 执行说明

## 1. 当前要做成什么

这个项目当前只做一件事：把单目标 DPS 计算链路做完整、做稳定、做清楚。

当前版本必须做到：

- 选择干员和技能；
- 输入敌方防御、法抗和条件开关；
- 输出单次伤害、总伤、DPS；
- 输出公式过程、规则命中、warnings；
- 对未知或歧义语义明确提示。

当前版本不做：

- 治疗或 HPS；
- 召唤物独立建模；
- 多目标模拟；
- 元素损伤混算。

## 2. 项目怎么分

### 2.1 `apps/web`

只负责页面，不负责公式。

它做三件事：

- 加载数据；
- 收集参数；
- 调用 `calculateSkillDps()` 展示结果。

### 2.2 `packages/calc-core`

这是核心，所有计算逻辑都放这里。

它负责：

- 原始数据转索引；
- 构建最终面板；
- 解析技能 blackboard；
- 应用 custom 规则；
- 生成攻击排程；
- 计算单次伤害、总伤、DPS；
- 输出 `ruleTrace`、`warnings`、公式说明。

### 2.3 `scripts`

负责辅助流程：

- 同步数据；
- 审计 blackboard 覆盖；
- 生成规则状态文档；
- 执行质量门禁；
- 生成发布快照。

## 3. 开发顺序

## 3.1 先定协议

先在 `packages/calc-core/src/types.ts` 里定死输入输出。

当前输入至少要有：

- 干员 ID；
- 技能 ID；
- 敌方防御；
- 敌方法抗；
- 条件开关；
- 物理保底伤害比例。

结果至少要有：

- `summary`
- `schedule`
- `streams`
- `ruleTrace`
- `warnings`
- `formula`

后面再补：

- 精英阶段；
- 等级；
- 技能等级；
- 信赖；
- 潜能；
- 模组。

完成标准：

- 只看类型定义，就知道一次计算需要什么、会输出什么。

## 3.2 再做数据索引

先把原始 JSON 转成内部统一结构，不能直接拿解包数据算。

在 `packages/calc-core/src/data.ts` 里做：

- `RawGameData`
- `buildOperatorIndexFromRaw()`
- 干员基础信息提取；
- 技能信息提取；
- blackboard key 识别；
- 未知 key 标记。

这里要完成的实际计算：

- 读最终精英阶段和等级关键帧；
- 累加潜能；
- 累加信赖；
- 解析当前天赋；
- 取技能 blackboard；
- 生成 `OperatorData` 和 `SkillData`。

完成标准：

- 输入原始 JSON，能稳定得到 `OperatorIndex`；
- 未知 key 不会被静默吞掉。

## 3.3 再做最终面板

最终参与伤害公式的，不是原始面板，而是最终战斗面板。

当前先合并这些来源：

- 基础面板；
- 潜能；
- 信赖；
- 天赋；
- 默认攻击类型。

后面继续补：

- 模组面板增益；
- 模组覆盖；
- 分支职业特殊逻辑；
- 条件触发的面板变化。

完成标准：

- 后续伤害公式统一读取最终面板，不再回头读原始 JSON。

## 3.4 再做 blackboard 归一化

blackboard 是参数，不是语义，所以要先转成统一效果结构。

当前至少归一化到：

- `attackType`
- `atkBuffRatio`
- `attackScale`
- `damageScale`
- `attackSpeedBonus`
- `defShredFlat`
- `defShredRate`
- `extraTrueDamageScale`

这里要做三件事：

- 建已知 key 白名单；
- 记录未知 key；
- 识别歧义语义。

并且要打初步标签：

- `switch_magical`
- `def_shred`
- `extra_true`
- `burst_short`
- `legacy_unmapped`
- `semantic_ambiguous`

完成标准：

- 任意技能进来后，都能落到统一结构；
- 不能解释的内容一定留下 warning 线索。

## 3.5 再做规则系统

不要把特例直接写死在主流程里。

每条规则都要有：

- `id`
- `match(context)`
- `transform(effects, context)`
- `note`

MVP 先迁这几类：

- 伤害类型切换；
- 条件减防/减抗；
- 附加真实伤害流；
- 短爆发排程修正。

每迁一条规则都按这个顺序：

1. 查旧项目语义；
2. 判断是改效果还是改排程；
3. 写规则；
4. 加测试；
5. 更新规则状态。

完成标准：

- 主流程里不直接写技能特例；
- 新增规则主要改规则文件和测试。

## 3.6 再做攻击排程

DPS 关键不是单次伤害，而是技能期间打几次。

MVP 版先做简化排程：

- 根据技能持续时间得到窗口；
- 根据基础攻击间隔和攻速算实际攻击间隔；
- 如果技能自带攻击次数，就优先用它；
- 否则按 `duration / attackInterval` 估算。

当前必须考虑：

- 基础攻击间隔；
- 攻速加成；
- 技能持续时间；
- 技能自带攻击次数；
- 短爆发修正。

后面再升级成时间轴模型，补：

- 前后摇；
- 最后一刀边界；
- 停手技能；
- 多段攻击；
- DOT；
- 额外触发流；
- 模式切换。

完成标准：

- 能解释为什么技能期间是这个攻击次数。

## 3.7 再做单次伤害公式

当前先实现三类伤害：

- 物理；
- 法术；
- 真实。

物理伤害主公式：

```text
attack = baseAttack * (1 + atkBuffRatio)
scaledAttack = attack * attackScale * damageScale
defenseAfterShred = max(enemyDef * (1 - defShredRate) - defShredFlat, 0)
raw = scaledAttack - defenseAfterShred
minimum = scaledAttack * minPhysicalDamageRatio
hitDamage = max(raw, minimum)
```

法术伤害主公式：

```text
mr = clamp(enemyMagicResistance, 0, 95)
magicMultiplier = 1 - mr / 100
hitDamage = scaledAttack * magicMultiplier
```

后面再补：

- 易伤乘区；
- 减抗；
- 多段结算；
- 附加伤害单独结算；
- 条件伤害切换。

完成标准：

- 任意一次伤害都能拆成公式步骤。

## 3.8 再做多伤害流汇总

很多技能不是只有主伤害，还会有附加流。

当前至少支持：

- `MAIN`
- `OTHER_TRUE`

每条流至少包含：

- `id`
- `attackType`
- `hitDamage`
- `attackCount`
- `totalDamage`

汇总逻辑：

```text
totalDamage = sum(stream.totalDamage)
dps = totalDamage / duration
```

后面再补：

- 额外法伤；
- DOT；
- 多段流；
- 条件分流。

完成标准：

- 能看出总伤是由哪些流组成的。

## 3.9 再做 warnings、ruleTrace、公式解释

这是项目区别于普通计算器的核心。

至少要输出：

- 未知 key warning；
- 歧义语义 warning；
- 部分覆盖 warning；
- 人工复核 warning；
- 规则命中记录；
- 公式过程。

公式至少分三块：

- `mainHit`
- `schedule`
- `summary`

完成标准：

- 结果不仅有数字，还有来源和可信度提示。

## 3.10 最后接前端页面

前端开发顺序：

1. 加载 JSON；
2. 构建索引；
3. 选干员；
4. 选技能；
5. 填敌方参数；
6. 切条件开关；
7. 展示摘要结果；
8. 展示伤害流；
9. 展示 warnings；
10. 展示 ruleTrace；
11. 展示公式。

前端只做：

- 组织 `CalculationInput`
- 调用 `calculateSkillDps()`
- 展示 `CalculationResult`

完成标准：

- 用户能完整走通“选人 -> 输入参数 -> 查看结果 -> 查看解释”。

## 4. 规则迁移怎么推进

你一个人做，不要全量乱迁，按 Top20 推进。

每个技能迁移都按这个步骤：

1. 查旧项目实现；
2. 查 blackboard 有没有未知 key；
3. 判断是加规则、改排程，还是先挂 warning；
4. 写规则；
5. 补样例；
6. 跑回归；
7. 更新状态文档。

完成标准：

- 每一轮都能明确新增覆盖了哪些技能。

## 5. 测试和门禁

最重要的是数值回归，不是 UI 测试。

必须有：

- 最小计算样例；
- Top20 回归样例；
- 条件开关双样例；
- warning 行为测试；
- ruleTrace 测试。

统一门禁入口：

```bash
npm run quality:gate
```

门禁步骤：

1. `npm run sync:data`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`
5. `npm run audit:custom`

完成标准：

- 每次大改之后都能一键验证是否稳定。

## 6. 发布怎么做

发布前必须完成：

1. 跑质量门禁；
2. 生成快照；
3. 记录当前数据版本；
4. 记录当前规则版本；
5. 明确回滚目标。

回滚顺序：

1. 先回规则；
2. 再回数据；
3. 必要时整体回滚。

完成标准：

- 任意一次发布都能回答：
  - 用的是哪版数据；
  - 用的是哪版规则；
  - 出问题退回哪一版。

## 7. 当前最应该先做的事

按现在仓库状态，优先做这 8 件事：

1. 补全 `CalculationInput`，加入养成参数和模组输入。
2. 扩充 `buildOperatorIndexFromRaw()`，把模组和更多天赋语义接进去。
3. 完善 blackboard 归一化，减少未知 key。
4. 持续补 `phase1CustomRules`，迁移旧项目高价值规则。
5. 升级排程模型，从次数估算逐步走向时间轴事件。
6. 扩充伤害流，不只保留主流和额外真伤流。
7. 补 Top20 回归样例和 warning 预期。
8. 优化结果页，把 warnings、公式、ruleTrace 展示清楚。

## 8. 一句话总结

这个项目真正要做的是：

```text
原始游戏数据
-> 内部索引
-> 最终面板
-> blackboard 归一化
-> custom 规则修正
-> 攻击排程
-> 单次伤害结算
-> 多伤害流汇总
-> warnings / ruleTrace / formula
-> 前端展示
```

把这条链路做完整，`QMcalculator` 才算真正落地。
