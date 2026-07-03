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
});
