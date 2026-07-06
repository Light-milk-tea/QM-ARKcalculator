import { describe, expect, it } from "vitest";
import { buildOperatorIndexFromRaw } from "../src";
import type { RawGameData } from "../src";

describe("buildOperatorIndexFromRaw", () => {
  it("阿斯卡纶一技能 duration=-1 时应按 1 秒兜底", () => {
    const raw: RawGameData = {
      character_table: {
        char_4132_ascln: {
          name: "阿斯卡纶",
          profession: "SPECIAL",
          subProfessionId: "stalker",
          phases: [
            {
              maxLevel: 90,
              attributesKeyFrames: [
                {
                  level: 90,
                  data: { maxHp: 1000, atk: 500, def: 100, magicResistance: 0, baseAttackTime: 3.5 },
                },
              ],
            },
          ],
          skills: [{ skillId: "skchr_ascln_1" }],
        },
      },
      skill_table: {
        skchr_ascln_1: {
          levels: [
            {
              name: "追袭",
              duration: -1,
              blackboard: [
                { key: "atk_scale", value: 2.1 },
                { key: "cnt", value: 3 },
              ],
            },
          ],
        },
      },
      uniequip_table: {},
      battle_equip_table: {},
      profession: {},
      subProfessionId: {},
    };

    const index = buildOperatorIndexFromRaw(raw);
    const skill = index.operators.char_4132_ascln?.skills.find((item) => item.id === "skchr_ascln_1");
    expect(skill).toBeDefined();
    expect(skill?.durationSeconds).toBe(1);
  });

  it("天赋与潜能攻速应写入 baseAttackSpeed", () => {
    const raw: RawGameData = {
      character_table: {
        char_211_adnach: {
          name: "安德切尔",
          profession: "SNIPER",
          subProfessionId: "fastshot",
          phases: [
            {
              maxLevel: 55,
              attributesKeyFrames: [
                {
                  level: 55,
                  data: { maxHp: 1080, atk: 365, def: 134, magicResistance: 0, baseAttackTime: 1 },
                },
              ],
            },
          ],
          potentialRanks: [
            {
              buff: {
                attributes: {
                  attributeModifiers: [{ attributeType: "ATTACK_SPEED", value: 2 }],
                },
              },
            },
          ],
          talents: [
            {
              candidates: [
                {
                  unlockCondition: { phase: "PHASE_0", level: 1 },
                  requiredPotentialRank: 0,
                  blackboard: [{ key: "attack_speed", value: 8 }],
                },
              ],
            },
          ],
          skills: [{ skillId: "skcom_atk_up[1]" }],
        },
      },
      skill_table: {
        "skcom_atk_up[1]": {
          levels: [{ name: "攻击强化", duration: 20, blackboard: [{ key: "atk", value: 0.45 }] }],
        },
      },
      uniequip_table: {},
      battle_equip_table: {},
      profession: {},
      subProfessionId: {},
    };

    const index = buildOperatorIndexFromRaw(raw);
    expect(index.operators.char_211_adnach?.baseAttackSpeed).toBe(10);
  });

  it("远山随机占卜天赋不应同时叠加到基础攻击与攻速", () => {
    const raw: RawGameData = {
      character_table: {
        char_109_fmout: {
          name: "远山",
          profession: "CASTER",
          subProfessionId: "splashcaster",
          phases: [
            {
              maxLevel: 70,
              attributesKeyFrames: [
                {
                  level: 70,
                  data: { maxHp: 1214, atk: 600, def: 99, magicResistance: 20, baseAttackTime: 2.9 },
                },
              ],
            },
          ],
          talents: [
            {
              candidates: [
                {
                  unlockCondition: { phase: "PHASE_2", level: 1 },
                  requiredPotentialRank: 4,
                  blackboard: [
                    { key: "attack_speed", value: 15 },
                    { key: "atk", value: 0.15 },
                    { key: "max_hp", value: 0.22 },
                  ],
                },
              ],
            },
          ],
          skills: [{ skillId: "skcom_magic_rage[2]" }],
        },
      },
      skill_table: {
        "skcom_magic_rage[2]": {
          levels: [{ name: "法术强化", duration: 25, blackboard: [{ key: "atk", value: 0.56 }] }],
        },
      },
      uniequip_table: {},
      battle_equip_table: {},
      profession: {},
      subProfessionId: {},
    };

    const index = buildOperatorIndexFromRaw(raw);
    const fmout = index.operators.char_109_fmout;
    expect(fmout?.baseAttack).toBe(600);
    expect(fmout?.baseAttackSpeed).toBe(0);
    expect(fmout?.baseHealth).toBe(1214);
  });
});
