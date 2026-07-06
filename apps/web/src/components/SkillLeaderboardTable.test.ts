import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SkillLeaderboardTable from "./SkillLeaderboardTable.vue";

describe("SkillLeaderboardTable", () => {
  it("点击行应触发 select 事件", async () => {
    const wrapper = mount(SkillLeaderboardTable, {
      props: {
        mode: "damage",
        selectedSkillId: "",
        rows: [
          {
            operatorId: "char_a",
            operatorName: "测试干员",
            skillId: "skill_a",
            skillName: "测试技能",
            attackType: "physical",
            result: {
              summary: { hitDamage: 100, totalDamage: 1000, dps: 100 },
              healing: { enabled: false, hitHealing: 0, totalHealing: 0, hps: 0, streams: [] },
              schedule: {
                attackInterval: 1,
                attackCount: 10,
                attackCountFromSkill: false,
                duration: 10,
                attackTimes: 0,
                mainAttackTimes: 1,
                ammoCount: 0,
                isPermanent: false,
              },
              streams: [],
              breakdown: [],
              formula: { mainHit: [], schedule: [], summary: [] },
              ruleTrace: [],
              warnings: [],
            },
          },
        ],
      },
    });

    await wrapper.find("tbody tr").trigger("click");
    const events = wrapper.emitted("select");
    expect(events).toBeTruthy();
    const payload = events?.[0]?.[0] as { skillId: string };
    expect(payload.skillId).toBe("skill_a");
  });
});
