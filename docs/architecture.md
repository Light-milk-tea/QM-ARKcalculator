# QMcalculator Architecture (MVP-DPS)

## Layers

1. `apps/web`: Vue UI and user interaction
2. `packages/calc-core`: framework-agnostic calculation engine
3. `scripts`: data sync and audit pipelines

## Core constraints

- UI never parses raw blackboard directly.
- All calculations enter from `calculateSkillDps()`.
- Unknown or ambiguous semantics must emit `warnings`.
