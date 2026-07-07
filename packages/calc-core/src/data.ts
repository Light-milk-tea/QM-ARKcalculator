import type {
  AttackType,
  ModuleData,
  ModuleStageBonus,
  OperatorData,
  OperatorIndex,
  RawGameData,
  SkillData,
} from "./types";

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

type CharacterLike = {
  name?: string;
  subProfessionId?: string;
  phases?: Array<{
    maxLevel?: number;
    attributesKeyFrames?: Array<{
      level?: number;
      data?: {
        maxHp?: number;
        atk?: number;
        def?: number;
        magicResistance?: number;
        baseAttackTime?: number;
      };
    }>;
  }>;
  favorKeyFrames?: Array<{
    level?: number;
    data?: {
      maxHp?: number;
      atk?: number;
      def?: number;
      magicResistance?: number;
    };
  }>;
  potentialRanks?: Array<{
    buff?: {
      attributes?: {
        attributeModifiers?: Array<{
          attributeType?: string;
          value?: number;
        }>;
      };
    };
  }>;
  talents?: Array<{
    candidates?: Array<{
      unlockCondition?: {
        phase?: string;
        level?: number;
      };
      requiredPotentialRank?: number;
      blackboard?: Array<{
        key?: string;
        value?: number;
      }>;
    }>;
  }>;
  skills?: Array<{ skillId?: string }>;
  profession?: string;
};

type SkillLike = {
  levels?: Array<{
    name?: string;
    duration?: number;
    blackboard?: Array<{ key?: string; value?: number }>;
    spData?: { levelUpCost?: number };
  }>;
};

type UniequipTableLike = {
  charEquip?: Record<string, string[]>;
  equipDict?: Record<string, { uniEquipName?: string }>;
};

type BattleEquipPhaseLike = {
  equipLevel?: number;
  attributeBlackboard?: Array<{ key?: string; value?: number }>;
};

type BattleEquipEntryLike = {
  phases?: BattleEquipPhaseLike[];
};

const knownBlackboardKeys = new Set([
  "atk",
  "atk_scale",
  "damage_scale",
  "attack_speed",
  "base_attack_time",
  "cnt",
  "times",
  "interval",
  "duration",
  "def",
  "magic_resistance",
  "ep_damage_ratio",
  "attack@atk",
  "attack@atk_scale",
  "attack@cnt",
  "attack@times",
  "attack@duration",
  "attack@interval",
  "attack@def",
  "attack@stun",
  "attack@prob",
  "attack@move_speed",
  "attack@sluggish",
  "attack@force",
  "attack@heal_scale",
  "attack@ep_damage_ratio",
  "attack@max_target",
  "attack@trigger_time",
  "max_target",
  "stun",
  "appear.atk_scale",
  "appear.stun",
  "horn_s_3[overload_start].atk",
  "horn_s_3[overload_start].interval",
  "horn_s_3[overload_start].hp_ratio",
  "horn_s_3[overload_start].damage_duration",
  "texas2_s_3[sword].interval",
  "thorns_s_3[b].atk",
  "thorns_s_3[b].attack_speed",
  "thorns_s_3[b].duration",
  "heal_scale",
  "heal_hpratio",
  "heal_hp_ratio",
  "heal_ratio",
  "heal",
  "heal_by_atk",
  "attack@heal_scale",
  "attack@heal_ratio",
  "attack@heal_hpratio",
  "heal_interval",
  "heal_times",
  "heal_duration",
  "attack@heal_interval",
  "attack@heal_times",
  "attack@heal_duration",
]);

const knownBlackboardPrefixes = ["talent@", "recipe.", "sandbox_res_collector."];

function isKnownBlackboardKey(key: string): boolean {
  if (knownBlackboardKeys.has(key)) return true;
  return knownBlackboardPrefixes.some((prefix) => key.startsWith(prefix));
}

function resolveAttackType(profession: string | undefined, subProfessionId: string | undefined): AttackType {
  if (profession === "MEDIC") {
    if (subProfessionId === "incantationmedic") {
      return "magical";
    }
    return "heal";
  }

  if (profession === "CASTER") {
    return "magical";
  }

  if (subProfessionId === "blessing") {
    return "heal";
  }

  const magicalSubprofessionHints = ["arts", "incantation", "mysticcaster", "corecaster", "phalanxcaster"];
  if (
    typeof subProfessionId === "string" &&
    magicalSubprofessionHints.some((hint) => subProfessionId.toLowerCase().includes(hint))
  ) {
    return "magical";
  }

  return "physical";
}

function collectUnmappedBlackboardKeys(keys: string[]): string[] {
  return keys.filter((key) => !isKnownBlackboardKey(key));
}

function deriveWarningSignals(keys: string[]) {
  return {
    hasAmbiguousSemantic:
      keys.includes("mode") ||
      keys.includes("branch_id") ||
      (keys.includes("atk") && keys.includes("attack@atk")),
  };
}

function inferCustomTags(params: {
  skillId: string;
  skillName: string;
  durationSeconds: number;
  keys: string[];
  attackScale: number;
  attackSpeedBonus: number;
  atkBuffRatio: number;
  unmappedBlackboardKeys: string[];
  hasAmbiguousSemantic: boolean;
  assumptionApplied: boolean;
}): string[] {
  const tags = new Set<string>();
  const keySet = new Set(params.keys);
  const lowerSkillName = params.skillName.toLowerCase();

  if (keySet.has("def") || keySet.has("attack@def") || keySet.has("magic_resistance")) {
    tags.add("def_shred");
  }
  if (
    lowerSkillName.includes("法术") ||
    lowerSkillName.includes("术式") ||
    params.skillId.includes("_magic_")
  ) {
    tags.add("switch_magical");
  }
  if (keySet.has("ep_damage_ratio") || keySet.has("attack@ep_damage_ratio")) {
    tags.add("extra_true");
  }
  if (
    params.durationSeconds <= 10 &&
    (params.attackSpeedBonus > 0 || params.attackScale >= 1.8 || params.atkBuffRatio >= 0.8)
  ) {
    tags.add("burst_short");
  }
  if (params.unmappedBlackboardKeys.length > 0) {
    tags.add("legacy_unmapped");
  }
  if (params.hasAmbiguousSemantic) {
    tags.add("semantic_ambiguous");
  }
  if (params.assumptionApplied) {
    tags.add("assumption_applied");
  }
  if (params.skillId === "skchr_horn_3") {
    tags.add("conditional_overload");
  }
  if (params.skillId === "skchr_texas2_3") {
    tags.add("extra_true");
  }
  if (params.skillId === "skchr_chen_2") {
    tags.add("burst_short");
  }
  if (params.skillId === "skchr_chen2_3") {
    tags.add("conditional_overload");
  }
  if (params.skillId === "skchr_mizuki_2") {
    tags.add("burst_short");
  }
  if (params.skillId === "skchr_thorns_3") {
    tags.add("assumption_applied");
  }

  return [...tags];
}

function parseSkill(skillId: string, raw: SkillLike): SkillData {
  const level = raw.levels?.[raw.levels.length - 1];
  const blackboard = level?.blackboard ?? [];
  const board = new Map(
    blackboard
      .filter((entry) => typeof entry.key === "string")
      .map((entry) => [entry.key as string, toNumber(entry.value)]),
  );
  const blackboardKeys = [...board.keys()];
  const unmappedBlackboardKeys = collectUnmappedBlackboardKeys(blackboardKeys);
  const warningSignals = deriveWarningSignals(blackboardKeys);
  const hasAmbiguousSemantic = warningSignals.hasAmbiguousSemantic;
  const triggerTime = board.get("attack@trigger_time") ?? board.get("trigger_time");
  const rawDuration = toNumber(level?.duration, 1);
  let durationSeconds = rawDuration;
  let assumptionApplied = false;
  if (
    skillId === "skchr_chen2_3" &&
    durationSeconds <= 0 &&
    typeof triggerTime === "number" &&
    triggerTime > 0
  ) {
    durationSeconds = triggerTime / 30;
    assumptionApplied = true;
  }
  if (skillId === "skchr_chen_2" && durationSeconds <= 0) {
    durationSeconds = 1;
    assumptionApplied = true;
  }
  if (skillId === "skchr_ascln_1" && durationSeconds <= 0) {
    // 阿斯卡纶一技能为瞬发多段，原始时长为 -1；统一按 1 秒兜底避免 DPS 被 0.1s 放大。
    durationSeconds = 1;
    assumptionApplied = true;
  }
  const attackScale = board.get("atk_scale") ?? board.get("attack@atk_scale") ?? 1;
  const atkBuffRatio = board.get("atk") ?? board.get("attack@atk") ?? 0;
  const attackSpeedBonus = board.get("attack_speed") ?? 0;
  const attackCount = board.get("cnt") ?? board.get("attack@cnt") ?? board.get("max_target");
  const healScale =
    board.get("heal_scale") ??
    board.get("heal_ratio") ??
    board.get("heal_hpratio") ??
    board.get("heal_hp_ratio") ??
    board.get("attack@heal_scale") ??
    board.get("attack@heal_ratio") ??
    board.get("attack@heal_hpratio");
  const healFlat = board.get("heal") ?? board.get("heal_by_atk") ?? 0;
  const skillName = toString(level?.name, skillId);
  const customTags = inferCustomTags({
    skillId,
    skillName,
    durationSeconds,
    keys: blackboardKeys,
    attackScale,
    attackSpeedBonus,
    atkBuffRatio,
    unmappedBlackboardKeys,
    hasAmbiguousSemantic,
    assumptionApplied,
  });

  return {
    id: skillId,
    name: skillName,
    durationSeconds,
    attackScale,
    damageScale: board.get("damage_scale") ?? 1,
    atkBuffRatio,
    attackSpeedBonus,
    attackCount: toNumber(attackCount, 0) > 0 ? toNumber(attackCount, 0) : undefined,
    // 以下扩展字段由 custom 规则系统注入，避免直接套用 blackboard 导致语义误判。
    attackIntervalAdjustment: 0,
    attackTimes: undefined,
    mainAttackTimes: undefined,
    durationOverride: undefined,
    durationAdjustment: 0,
    flatAttack: 0,
    defPenetrateFixed: 0,
    magicResistanceReduction: 0,
    extraAttackScale: 0,
    extraAttackInterval: undefined,
    extraAttackTimes: undefined,
    extraDuration: undefined,
    healScale,
    healFlat,
    healFromDamageRatio: undefined,
    healAttackInterval: board.get("heal_interval") ?? board.get("attack@heal_interval"),
    healAttackTimes: board.get("heal_times") ?? board.get("attack@heal_times"),
    healDuration: board.get("heal_duration") ?? board.get("attack@heal_duration"),
    ammoCount: undefined,
    customTags,
    unmappedBlackboardKeys,
    hasAmbiguousSemantic,
  };
}

function resolvePhaseOrder(phase: string | undefined): number {
  if (phase === "PHASE_2") return 2;
  if (phase === "PHASE_1") return 1;
  return 0;
}

function resolvePotentialBonus(character: CharacterLike) {
  const bonus = { maxHp: 0, atk: 0, def: 0, magicResistance: 0, attackSpeed: 0 };
  const keyMap: Record<string, keyof typeof bonus> = {
    MAX_HP: "maxHp",
    ATK: "atk",
    DEF: "def",
    MAGIC_RESISTANCE: "magicResistance",
    ATTACK_SPEED: "attackSpeed",
  };

  for (const rank of character.potentialRanks ?? []) {
    const modifiers = rank.buff?.attributes?.attributeModifiers ?? [];
    for (const modifier of modifiers) {
      const mappedKey = keyMap[modifier.attributeType ?? ""];
      if (!mappedKey) continue;
      bonus[mappedKey] += toNumber(modifier.value, 0);
    }
  }

  return bonus;
}

function resolveTrustBonus(character: CharacterLike) {
  const trustFrame = [...(character.favorKeyFrames ?? [])].sort(
    (a, b) => toNumber(b.level, 0) - toNumber(a.level, 0),
  )[0];

  return {
    maxHp: toNumber(trustFrame?.data?.maxHp, 0),
    atk: toNumber(trustFrame?.data?.atk, 0),
    def: toNumber(trustFrame?.data?.def, 0),
    magicResistance: toNumber(trustFrame?.data?.magicResistance, 0),
  };
}

function resolveTalentBonus(character: CharacterLike, currentPhase: number, currentLevel: number) {
  const maxPotentialRank = Math.max((character.potentialRanks?.length ?? 1) - 1, 0);
  const bonus = {
    atkRatio: 0,
    hpRatio: 0,
    defRatio: 0,
    magicResistanceFlat: 0,
    baseAttackTimeFlat: 0,
    attackSpeedFlat: 0,
  };

  for (const talentGroup of character.talents ?? []) {
    const matched = [...(talentGroup.candidates ?? [])]
      .filter((candidate) => {
        const unlockPhase = resolvePhaseOrder(candidate.unlockCondition?.phase);
        const unlockLevel = toNumber(candidate.unlockCondition?.level, 1);
        const requiredPotentialRank = toNumber(candidate.requiredPotentialRank, 0);
        const phaseReady = unlockPhase < currentPhase || (unlockPhase === currentPhase && unlockLevel <= currentLevel);
        return phaseReady && requiredPotentialRank <= maxPotentialRank;
      })
      .sort((a, b) => {
        const phaseDiff =
          resolvePhaseOrder(b.unlockCondition?.phase) - resolvePhaseOrder(a.unlockCondition?.phase);
        if (phaseDiff !== 0) return phaseDiff;
        const levelDiff = toNumber(b.unlockCondition?.level, 1) - toNumber(a.unlockCondition?.level, 1);
        if (levelDiff !== 0) return levelDiff;
        return toNumber(b.requiredPotentialRank, 0) - toNumber(a.requiredPotentialRank, 0);
      })[0];

    for (const board of matched?.blackboard ?? []) {
      const key = board.key ?? "";
      const value = toNumber(board.value, 0);
      if (key === "atk") bonus.atkRatio += value;
      if (key === "max_hp") bonus.hpRatio += value;
      if (key === "def") bonus.defRatio += value;
      if (key === "magic_resistance") bonus.magicResistanceFlat += value;
      if (key === "base_attack_time") bonus.baseAttackTimeFlat += value;
      if (key === "attack_speed") bonus.attackSpeedFlat += value;
    }
  }

  return bonus;
}

const talentExclusionByOperatorId: Record<
  string,
  Partial<{
    atkRatio: true;
    hpRatio: true;
    defRatio: true;
    magicResistanceFlat: true;
    baseAttackTimeFlat: true;
    attackSpeedFlat: true;
  }>
> = {
  // 远山“占卜”为随机三选一，不应将 atk / attack_speed / max_hp 同时计入基础面板。
  char_109_fmout: { atkRatio: true, hpRatio: true, attackSpeedFlat: true },
  // 清道夫天赋为条件触发，旧项目默认口径不计入常驻攻击倍率。
  char_149_scave: { atkRatio: true },
  // 红豆天赋在旧项目通过期望乘区处理，不直接并入基础面板。
  char_290_vigna: { atkRatio: true },
  // 杜宾天赋为队伍条件效果，旧项目默认口径不计入自身常驻攻击倍率。
  char_130_doberm: { atkRatio: true },
  // 铅踝天赋为条件触发，旧项目默认口径不直接计入常驻攻击倍率。
  char_4062_totter: { atkRatio: true },
};

function applyTalentExclusions(
  charId: string,
  bonus: ReturnType<typeof resolveTalentBonus>,
): ReturnType<typeof resolveTalentBonus> {
  const rule = talentExclusionByOperatorId[charId];
  if (!rule) return bonus;
  return {
    atkRatio: rule.atkRatio ? 0 : bonus.atkRatio,
    hpRatio: rule.hpRatio ? 0 : bonus.hpRatio,
    defRatio: rule.defRatio ? 0 : bonus.defRatio,
    magicResistanceFlat: rule.magicResistanceFlat ? 0 : bonus.magicResistanceFlat,
    baseAttackTimeFlat: rule.baseAttackTimeFlat ? 0 : bonus.baseAttackTimeFlat,
    attackSpeedFlat: rule.attackSpeedFlat ? 0 : bonus.attackSpeedFlat,
  };
}

function readModuleStageBonus(phase?: BattleEquipPhaseLike): ModuleStageBonus {
  const board = phase?.attributeBlackboard ?? [];
  const atk = toNumber(board.find((item) => item.key === "atk")?.value, 0);
  const attackSpeed = toNumber(board.find((item) => item.key === "attack_speed")?.value, 0);
  const atkScale = toNumber(board.find((item) => item.key === "atk_scale")?.value, 1);
  const damageScale = toNumber(board.find((item) => item.key === "damage_scale")?.value, 1);
  const defPenetrateFixed = toNumber(board.find((item) => item.key === "def_penetrate_fixed")?.value, 0);
  const magicResistanceReduction = toNumber(
    board.find((item) => item.key === "magic_resistance")?.value,
    0,
  );
  return { atk, attackSpeed, atkScale, damageScale, defPenetrateFixed, magicResistanceReduction };
}

function resolveModules(
  charId: string,
  uniequipTable: UniequipTableLike,
  battleEquipTable: Record<string, BattleEquipEntryLike>,
): ModuleData[] {
  const equipIds = uniequipTable.charEquip?.[charId] ?? [];
  return equipIds
    .filter((equipId) => equipId in battleEquipTable)
    .map((equipId) => {
      const phases = battleEquipTable[equipId]?.phases ?? [];
      const byLevel = new Map<number, ModuleStageBonus>();
      for (const phase of phases) {
        byLevel.set(toNumber(phase.equipLevel, byLevel.size + 1), readModuleStageBonus(phase));
      }

      const stage1 = byLevel.get(1) ?? readModuleStageBonus(phases[0]);
      const stage2 = byLevel.get(2) ?? readModuleStageBonus(phases[1]) ?? stage1;
      const stage3 = byLevel.get(3) ?? readModuleStageBonus(phases[2]) ?? stage2;
      return {
        id: equipId,
        name: uniequipTable.equipDict?.[equipId]?.uniEquipName ?? equipId,
        stageBonuses: [
          {
            atk: 0,
            attackSpeed: 0,
            atkScale: 1,
            damageScale: 1,
            defPenetrateFixed: 0,
            magicResistanceReduction: 0,
          },
          stage1,
          stage2,
          stage3,
        ],
      } satisfies ModuleData;
    });
}

export function buildOperatorIndexFromRaw(rawData: RawGameData): OperatorIndex {
  const characters = rawData.character_table as Record<string, CharacterLike>;
  const skills = rawData.skill_table as Record<string, SkillLike>;
  const uniequipTable = rawData.uniequip_table as UniequipTableLike;
  const battleEquipTable = rawData.battle_equip_table as Record<string, BattleEquipEntryLike>;
  const operators: Record<string, OperatorData> = {};

  for (const [charId, character] of Object.entries(characters)) {
    if (!character.skills?.length) {
      continue;
    }

    const finalPhaseIndex = (character.phases?.length ?? 1) - 1;
    const finalPhase = character.phases?.[finalPhaseIndex];
    const keyFrames = finalPhase?.attributesKeyFrames;
    const keyFrame = keyFrames?.[keyFrames.length - 1]?.data;
    const currentLevel = toNumber(
      finalPhase?.maxLevel,
      toNumber(keyFrames?.[keyFrames.length - 1]?.level, 1),
    );
    const potentialBonus = resolvePotentialBonus(character);
    const trustBonus = resolveTrustBonus(character);
    const talentBonus = applyTalentExclusions(
      charId,
      resolveTalentBonus(character, finalPhaseIndex, currentLevel),
    );

    const beforeTalentAttack = toNumber(keyFrame?.atk, 100) + potentialBonus.atk + trustBonus.atk;
    const beforeTalentHealth = toNumber(keyFrame?.maxHp, 0) + potentialBonus.maxHp + trustBonus.maxHp;
    const beforeTalentDefense = toNumber(keyFrame?.def, 0) + potentialBonus.def + trustBonus.def;
    const beforeTalentMagicResistance =
      toNumber(keyFrame?.magicResistance, 0) + potentialBonus.magicResistance + trustBonus.magicResistance;
    const parsedSkills = character.skills
      .map((entry) => entry.skillId)
      .filter((id): id is string => typeof id === "string" && id in skills)
      .map((skillId) => parseSkill(skillId, skills[skillId]!));

    if (!parsedSkills.length) {
      continue;
    }

    operators[charId] = {
      id: charId,
      name: toString(character.name, charId),
      baseHealth: beforeTalentHealth * (1 + talentBonus.hpRatio),
      baseAttack: beforeTalentAttack * (1 + talentBonus.atkRatio),
      baseDefense: beforeTalentDefense * (1 + talentBonus.defRatio),
      baseMagicResistance: beforeTalentMagicResistance + talentBonus.magicResistanceFlat,
      baseAttackInterval: toNumber(keyFrame?.baseAttackTime, 1) + talentBonus.baseAttackTimeFlat,
      baseAttackSpeed: 0,
      subProfessionId: character.subProfessionId,
      modules: resolveModules(charId, uniequipTable, battleEquipTable),
      defaultAttackType: resolveAttackType(character.profession, character.subProfessionId),
      skills: parsedSkills,
    };
  }

  return { operators };
}
