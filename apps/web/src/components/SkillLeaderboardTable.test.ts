import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SkillLeaderboardTable from "./SkillLeaderboardTable.vue";
import type { LeaderboardRow } from "../stores/useLeaderboardStore";

function createRow(overrides: Partial<LeaderboardRow> = {}): LeaderboardRow {
  return {
    operatorId: "char_a",
    operatorName: "测试干员",
    skillId: "skill_a",
    skillName: "测试技能",
    attackType: "physical",
    result: {
      summary: { hitDamage: 100, totalDamage: 1000, dps: 100 },
      healing: { enabled: true, hitHealing: 50, totalHealing: 500, hps: 50, streams: [] },
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
      warnings: [{ code: "WARN_INFO_LIMITATION", level: "P2", message: "test" }],
    },
    ...overrides,
  };
}

describe("SkillLeaderboardTable", () => {
  it("点击行应触发 select 事件", async () => {
    const wrapper = mount(SkillLeaderboardTable, {
      props: {
        mode: "damage",
        selectedSkillId: "",
        rows: [createRow()],
      },
    });

    await wrapper.find("tbody tr").trigger("click");
    const events = wrapper.emitted("select");
    expect(events).toBeTruthy();
    const payload = events?.[0]?.[0] as { skillId: string };
    expect(payload.skillId).toBe("skill_a");
  });

  it("应中文化攻击类型与警告列表头", () => {
    const wrapper = mount(SkillLeaderboardTable, {
      props: {
        mode: "damage",
        selectedSkillId: "",
        rows: [createRow({ attackType: "none" }), createRow({ attackType: "magical", skillId: "skill_b" })],
      },
    });

    expect(wrapper.text()).toContain("无伤害");
    expect(wrapper.text()).toContain("法术");
    expect(wrapper.text()).toContain("警告数");
    expect(wrapper.text()).not.toContain("Warnings");
  });

  it("伤害榜只显示伤害列，治疗榜只显示治疗列", async () => {
    const damageWrapper = mount(SkillLeaderboardTable, {
      props: {
        mode: "damage",
        selectedSkillId: "",
        rows: [createRow()],
      },
    });
    expect(damageWrapper.text()).toContain("单次伤害");
    expect(damageWrapper.text()).toContain("总伤");
    expect(damageWrapper.text()).toContain("DPS");
    expect(damageWrapper.text()).not.toContain("HPS");
    expect(damageWrapper.text()).not.toContain("总治疗");

    const healingWrapper = mount(SkillLeaderboardTable, {
      props: {
        mode: "healing",
        selectedSkillId: "",
        rows: [createRow()],
      },
    });
    expect(healingWrapper.text()).toContain("单次治疗");
    expect(healingWrapper.text()).toContain("总治疗");
    expect(healingWrapper.text()).toContain("HPS");
    expect(healingWrapper.text()).not.toContain("单次伤害");
    expect(healingWrapper.text()).not.toContain("总伤");
    expect(healingWrapper.text()).not.toContain("DPS");
  });
});
