# QMcalculator UI 改造方案:深度 Wiki 化 + 组件拆分

## 1. 背景与现状

### 1.1 用户诉求

* 页面**过于紧凑**,需要更舒展的排版与呼吸感

* UI 需要**美化**,向真正的 MediaWiki 词条质感靠拢

* 不需要暗色主题(仅白天)

* 需要把单文件 `HomePage.vue` 拆为多组件

### 1.2 现状盘点(基于 Phase 1 探索)

| 文件                                         | 现状                                                                                                                  | 问题                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `apps/web/src/pages/HomePage.vue`          | 416 行单文件,包含 8 个内容区块(参数表/结果/Rule Trace/Warnings/Formula/Streams/Breakdown)                                           | 1) 视觉密度高,行内样式 `<table style="...">` 满天飞; 2) Infobox 浮动后正文立即紧贴,无 TOC; 3) 标题层级混杂,缺乏词条级排版 |
| `apps/web/src/style.css`                   | 已有 `.wiki-first-heading` / `.wiki-heading` / `.wiki-subheading` / `.wiki-table` / `.wiki-infobox` / `.wiki-input` 等 | 1) 表头背景过浅,缺乏 wikitable 经典的 `#eaecf0` 灰度; 2) 缺少 TOC、词条页脚、标签页、编辑摘要等 Wiki 元素样式            |
| `apps/web/tailwind.config.js`              | 已定义 `arkrec.*` 调色板,`darkMode: "class"`                                                                              | 1) 缺少 serif 字体族; 2) 缺少 `text-link` 等专用语义色; 3) 未启用中文衬线字体                                |
| `apps/web/index.html`                      | 已引入 Noto Sans/Serif SC + Rajdhani                                                                                   | 字体声明了但 CSS 中未实际绑定                                                                      |
| `.trae/documents/wiki_ui_refactor_plan.md` | 上一轮 Wiki 化方案                                                                                                        | 已被部分实施,但未完成组件拆分,布局仍紧凑                                                                  |

## 2. 改造目标

| 维度   | 目标                                                                        |
| ---- | ------------------------------------------------------------------------- |
| 排版密度 | 主区 `max-w-[1180px]`,正文章节 `max-w-[760px]`,章节间距 ≥ `2rem`,表格之间 `mt-2 mb-6`   |
| 视觉风格 | 严格对齐 MediaWiki 词条: 衬线大标题 / 灰底表头 / 蓝色内链 / 右侧 Infobox / 左侧 TOC 锚点 / 词条底部署名行 |
| 组件拆分 | 把 `HomePage.vue` 拆为 8 个职责单一的 SFC,降低耦合,后续扩展(天赋面板、模组面板)有处可插                 |
| 字体   | 中文衬线(Noto Serif SC)用于标题与正文首段,无衬线(Noto Sans SC)用于表单与小字,等宽(系统 mono)用于公式     |
| 暗色   | **不做**,沿用 `darkMode: "class"` 但不暴露切换                                      |

## 3. 拟定修改清单

### 3.1 配置层

#### `apps/web/tailwind.config.js`

* 调整 `fontFamily`:

  * `serif`: `["Noto Serif SC", "Songti SC", "STSong", "SimSun", "serif"]`

  * `sans`: `["Noto Sans SC", ...]`

  * `mono`: `["ui-monospace", "SFMono-Regular", "Menlo", "monospace"]`

* 调色板补强(语义命名):

  * `arkrec.ink`: `#202122`(主文字)

  * `arkrec.softInk`: `#54595d`(次文字)

  * `arkrec.rule`: `#a2a9b1`(分隔线/边框)

  * `arkrec.panel`: `#f8f9fa`

  * `arkrec.sub`: `#eaecf0`(表头底)

  * `arkrec.link`: `#0645ad`

  * `arkrec.linkHover`: `#0b0080`

  * `arkrec.note`: `#72777d`(注释灰)

  * `arkrec.danger`: `#d33` / `arkrec.success`: `#00af89`

* 新增 `boxShadow`:

  * `wiki-card`: `0 1px 2px rgba(0,0,0,.04)`

* 新增 `borderRadius`: `wiki: 2px` (MediaWiki 几乎没有圆角)

### 3.2 全局样式 `apps/web/src/style.css`

在已有 `.wiki-*` 基础上**新增/修订**:

* `.wiki-shell`: 词条外框容器,`max-w-[1180px] mx-auto px-6 lg:px-10`

* `.wiki-titlebar`: 标题区(标题 + 副标题 + 词条统计)

  * `font-serif text-[2.4rem] leading-tight border-b border-arkrec-rule pb-2`

* `.wiki-subtitle`: 灰色副标题 `text-arkrec-softInk text-[0.9rem]`

* `.wiki-byline`: "本词条最后编辑于 ..." 风格 `text-[0.78rem] text-arkrec-note`

* `.wiki-section`: 二级标题 `text-[1.5rem] font-serif border-b border-arkrec-rule pb-1 mb-4 mt-8 flex items-baseline gap-2` (左侧加 `§` 锚点)

* `.wiki-subsection`: 三级标题 `text-[1.2rem] font-bold mt-6 mb-2`

* `.wiki-minor`: 四级标题 `text-[1rem] font-bold mt-4 mb-2`

* `.wiki-paragraph`: 段落 `text-[0.95rem] leading-7 my-3`

* `.wiki-toc`: 左侧目录,固定 `w-[200px]`,行高紧凑 `text-[0.85rem]`

* `.wiki-toc-link`: 锚点链接 `text-arkrec-link hover:underline`

* `.wiki-footnotes`: 词条底部署名行容器 `border-t border-arkrec-rule mt-10 pt-3 text-[0.78rem] text-arkrec-note`

* `.wiki-tag`: 内联标签(替代 dashboard 风的徽标) `text-[0.7rem] uppercase tracking-wider text-arkrec-softInk border border-arkrec-rule px-1.5 py-0.5 mr-1`

* `.wiki-callout`: 信息提示框(可被 Rule Trace / Warnings 复用) `border border-arkrec-rule bg-arkrec-panel px-3 py-2 text-[0.85rem]`

* `.wiki-callout-danger`: 危险变体 `border-arkrec-danger bg-[#fdf2f2]`

* `.wiki-callout-success`: 成功变体 `border-arkrec-success bg-[#f0fbf7]`

* 修订 `.wiki-table`:

  * 表头底色 `bg-arkrec-sub`,加粗居中

  * 行间留白 `px-3 py-2`(原 `px-2 py-1`)

  * 偶数行可选 `bg-white` / `bg-arkrec-panel` 实现斑马纹 (`.wiki-table--zebra`)

* 修订 `.wiki-input` / `.wiki-select`:

  * 默认 `h-9`(原 \~ `h-7`),`text-[0.9rem]`

  * 焦点态保留,圆角改 `rounded-wiki`(`2px`)

* 修订 `.wiki-infobox`:

  * 取消 `float-right`(改 sticky 浮于右上)

  * 标题加 "干员信息" 副标题

  * 表格行高增加

### 3.3 组件拆分 `apps/web/src/components/`

新建以下 8 个 SFC,统一 `script setup lang="ts"`,无业务状态(均由 props 传入,事件 emit 回 `HomePage`):

| 组件                    | 职责                                               | 关键 props / emits                |
| --------------------- | ------------------------------------------------ | ------------------------------- |
| `AppHeader.vue`       | 顶部站点条(类 MediaWiki `p-personal` + `p-navigation`) | `loading, loaded, error`        |
| `ArticleTitleBar.vue` | 词条标题区(主标题 + 副标题 + byline)                        | `title, subtitle, lastEdited`   |
| `ArticleToc.vue`      | 左侧目录(锚点滚动)                                       | `sections: { id, label }[]`     |
| `OperatorInfobox.vue` | 右侧浮动干员信息框                                        | `operator: OperatorData`        |
| `ParameterForm.vue`   | 参数设置区块(关键词/干员/技能/敌人/条件)                          | 全部为 props + emit                |
| `ResultSummary.vue`   | 计算结果四宫格(DPH/DPS/总伤/次数)                           | `summary, schedule`             |
| `RuleTracePanel.vue`  | 规则追踪 + 系统警告(双 callout)                           | `ruleTrace, warnings`           |
| `FormulaViewer.vue`   | 公式区(折叠按钮 + DPS 公式 + 3 张步骤表)                      | `formula, summary, schedule`    |
| `StreamsTable.vue`    | 伤害流明细表                                           | `streams: DamageStreamResult[]` |
| `BreakdownTable.vue`  | 公式分解表                                            | `breakdown: BreakdownItem[]`    |
| `ArticleFooter.vue`   | 词条底部署名                                           | `ruleVersion, dataVersion`      |

> 注: 实际数量为 11 个 SFC,加上 `AppHeader.vue` 共 11 个。**避免过度组件化**: 表格类(Streams / Breakdown)各自独立是因为日后可能加筛选/排序;`RuleTracePanel` 与 `WarningList` 合并为一个文件,共享 callout 容器。

### 3.4 主页面重写 `apps/web/src/pages/HomePage.vue`

* 保留 `<script setup>` 中的 store/composable 引用

* 模板结构改为:

```vue
<template>
  <div class="min-h-screen bg-white">
    <AppHeader :loading="loading" :loaded="loaded" :error="error" />

    <div class="wiki-shell">
      <ArticleTitleBar
        title="单目标 DPS 计算闭环"
        subtitle="基于最新游戏数据的完全解耦计算引擎,支持 ruleTrace 与 warnings 报告。"
        :last-edited="lastEdited"
      />

      <div class="lg:grid lg:grid-cols-[200px_minmax(0,1fr)_300px] lg:gap-8">
        <!-- 左侧 TOC -->
        <ArticleToc :sections="tocSections" class="hidden lg:block" />

        <!-- 中部正文 -->
        <article class="wiki-content min-w-0">
          <section id="params">
            <h2 class="wiki-section">参数设置</h2>
            <ParameterForm
              v-model:keyword="selectionStore.keyword"
              v-model:operatorId="selectionStore.operatorId"
              v-model:skillId="selectionStore.skillId"
              v-model:defense="battleStore.defense"
              v-model:magicResistance="battleStore.magicResistance"
              v-model:minPhysicalDamageRatio="battleStore.minPhysicalDamageRatio"
              v-model:conditionEnabled="battleStore.conditionEnabled"
              :operators="operators"
              :selected-skills="selectedSkills"
              :default-level-text="defaultLevelText"
            />
          </section>

          <section id="result">
            <h2 class="wiki-section">计算结果</h2>
            <ResultSummary v-if="result" :summary="result.summary" :schedule="result.schedule" />
            <div v-else class="wiki-callout">请先选择有效的干员与技能。</div>
          </section>

          <section v-if="result" id="rules">
            <h2 class="wiki-section">规则与警告</h2>
            <RuleTracePanel :rule-trace="result.ruleTrace" :warnings="result.warnings" />
          </section>

          <section v-if="result" id="formula">
            <h2 class="wiki-section">计算公式</h2>
            <FormulaViewer :formula="result.formula" :summary="result.summary" :schedule="result.schedule" />
          </section>

          <section v-if="result" id="streams">
            <h2 class="wiki-section">伤害流明细</h2>
            <StreamsTable :streams="result.streams" />
          </section>

          <section v-if="result" id="breakdown">
            <h2 class="wiki-section">公式分解</h2>
            <BreakdownTable :breakdown="result.breakdown" />
          </section>
        </article>

        <!-- 右侧 Infobox -->
        <aside class="lg:sticky lg:top-4 lg:self-start">
          <OperatorInfobox :operator="selectedOperator" />
        </aside>
      </div>

      <ArticleFooter :rule-version="ruleVersion" :data-version="dataVersion" />
    </div>
  </div>
</template>
```

* 移除内联 `style="..."` 表达式,全部下沉到 `style.css`

* 移除 `<style scoped>` 空块

* `tocSections` 由固定数组 + 模板字面量生成

### 3.5 `App.vue` 与 `main.ts`

* `App.vue` 不动(已是最薄壳)

* `main.ts` 不动

## 4. 组件间数据流

```
useSelectionStore + useBattleConfigStore + useGameData + useCalculation
                                  │
                                  ▼
                          HomePage.vue (组合层)
                                  │
        ┌─────────┬───────────────┼───────────────┬──────────────┐
        ▼         ▼               ▼               ▼              ▼
   AppHeader  ArticleToc   ParameterForm   ResultSummary   OperatorInfobox
                                  │               │
                                  ▼               ▼
                          RuleTracePanel  FormulaViewer
                                                │
                                  ┌─────────────┼─────────────┐
                                  ▼             ▼             ▼
                            StreamsTable  BreakdownTable  ArticleFooter
```

* **单向数据流**: store → `HomePage` → 子组件 props

* **事件回流**: 子组件 `emit('update:xxx', value)` → `HomePage` 调 `store.action`(已存在的 `persist`)

* **避免**: 把 `useCalculation()` 在子组件里再调一次(已在 `HomePage` 算好后分发)

## 5. 假设与决策

| #  | 决策                                                         | 理由                                           |
| -- | ---------------------------------------------------------- | -------------------------------------------- |
| D1 | 保留 Infobox 浮动,改为 `lg:sticky` 而非 `float-right`              | `float-right` 与 TOC 三栏 grid 冲突,sticky 滚动更稳   |
| D2 | 不引入第三方 UI 库(Naive/Element Plus)                            | 保持代码极简,与"类 Wiki"理念冲突,纯 Tailwind + 少量 CSS 已足  |
| D3 | TOC 固定 6 个二级锚点,不做展开/折叠                                     | 避免引入额外状态,内容少时无需                              |
| D4 | 表头斑马纹采用 CSS 而非 JS                                          | `.wiki-table--zebra` 通过 `nth-child(even)` 实现 |
| D5 | `OperatorInfobox` 在无选中干员时展示"请先选择干员"占位                      | 与现状一致,避免布局抖动                                 |
| D6 | 词条 byline 写死为 "最后编辑于 2026-07-02",后续可接入 release-snapshot 时间 | MVP 不接,固化以确保编译通过                             |
| D7 | 不引入 `dark:` 样式块                                            | 主题切换未来再补,本次仅白天                               |
| D8 | 移除原 `<style scoped>` 块和所有行内 `style="..."`                  | 全部走 `.wiki-*` 类,保持单一来源                       |

## 6. 风险与缓解

| 风险                           | 缓解                                                                   |
| ---------------------------- | -------------------------------------------------------------------- |
| 三栏 grid 在窄屏(<1024px)可能挤压     | 移动端隐藏 TOC(<1024 `hidden`),Infobox 下沉到内容底部;已有 `lg:` 前缀                |
| 公式表格在窄屏横向溢出                  | 给 `wiki-table` 父容器加 `overflow-x-auto` 包裹                             |
| 组件拆分后类型导入链变长                 | 在 `components/` 同级建立 `types.ts` 仅 re-export 自 `@qm/calc-core`,避免循环依赖 |
| 局部刷新性能: store 写入触发 `persist` | 现有逻辑已 `watch` + `deep`,保持不变                                          |
| 衬线字体初次加载慢                    | 已在 `index.html` 预连接 Google Fonts,无新依赖                                |

## 7. 验证步骤

1. **类型检查**: `cd QMcalculator && pnpm --filter web typecheck` 必须通过
2. **构建检查**: `pnpm --filter web build` 必须通过(确保 v3.5 Vue + Tailwind 编译无误)
3. **本地预览**:

   * `pnpm --filter web dev`

   * 打开 `http://localhost:5173/`

   * 视觉验收点:

     * [ ] 标题为衬线字体,词条感强

     * [ ] 左侧 TOC 仅在大屏可见,点击锚点平滑滚动

     * [ ] 右侧 Infobox 滚动时跟随(sticky)

     * [ ] 主区宽度 1180px 居中,正文不挤

     * [ ] 表格行高 `py-2` 较之前明显舒展

     * [ ] 警告 / 规则追踪 使用 callout 容器,边界清晰

     * [ ] 词条底部署名行存在并显示 `ruleVersion` / `dataVersion`
4. **回归计算正确性**:

   * 选择同一干员/技能,对比改造前后的 DPH/DPS 数值

   * 期望完全一致(本次只动 UI,不动 `useCalculation.ts`)
5. **响应式冒烟**: 在 1280 / 1024 / 768 / 375 四个断点各看一次,确认 TOC 与 Infobox 行为正确

## 8. 实施顺序(供后续 Execute 阶段使用)

1. 改 `tailwind.config.js`(字体 + 调色板 + 圆角 + 阴影)
2. 改 `style.css`(新增/修订 `.wiki-*` 类)
3. 新建 `components/ArticleTitleBar.vue` → `OperatorInfobox.vue` → `ParameterForm.vue` → `ResultSummary.vue` → `RuleTracePanel.vue` → `FormulaViewer.vue` → `StreamsTable.vue` → `BreakdownTable.vue` → `ArticleToc.vue` → `ArticleFooter.vue` → `AppHeader.vue`(从底向上易测)
4. 改写 `HomePage.vue`,把旧 416 行模板替换为 11 个子组件的组合
5. 删除 `HomePage.vue` 中残留的 `formulaDescription()` 等纯展示函数(下放到 `FormulaViewer.vue`)
6. 跑 `typecheck` + `build` + 手动 dev 验收

## 9. 不在本次范围

* 暗色主题与切换按钮

* 移动端汉堡菜单 / 抽屉

* 公式区引入 MathJax / KaTeX 渲染(后续 Phase B 再考虑)

* 词条历史版本对比 / diff 视图

* 多语言切换

* 召唤物/天赋独立面板

