import type { OperatorData, OperatorIndex, RawGameData, SkillData } from "./types";

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

type CharacterLike = {
  name?: string;
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

function parseSkill(skillId: string, raw: SkillLike): SkillData {
  const level = raw.levels?.[raw.levels.length - 1];
  const blackboard = level?.blackboard ?? [];
  const board = new Map(blackboard.map((entry) => [entry.key ?? "", toNumber(entry.value)]));

  return {
    id: skillId,
    name: toString(level?.name, skillId),
    durationSeconds: toNumber(level?.duration, 1),
    attackScale: board.get("atk_scale") ?? 1,
    damageScale: board.get("damage_scale") ?? 1,
    atkBuffRatio: board.get("atk") ?? 0,
    attackSpeedBonus: board.get("attack_speed") ?? 0,
    customTags: [],
  };
}

function resolvePhaseOrder(phase: string | undefined): number {
  if (phase === "PHASE_2") return 2;
  if (phase === "PHASE_1") return 1;
  return 0;
}

function resolvePotentialBonus(character: CharacterLike) {
  const bonus = { maxHp: 0, atk: 0, def: 0, magicResistance: 0 };
  const keyMap: Record<string, keyof typeof bonus> = {
    MAX_HP: "maxHp",
    ATK: "atk",
    DEF: "def",
    MAGIC_RESISTANCE: "magicResistance",
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
    }
  }

  return bonus;
}

export function buildOperatorIndexFromRaw(rawData: RawGameData): OperatorIndex {
  const characters = rawData.character_table as Record<string, CharacterLike>;
  const skills = rawData.skill_table as Record<string, SkillLike>;
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
    const talentBonus = resolveTalentBonus(character, finalPhaseIndex, currentLevel);

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
      defaultAttackType: "physical",
      skills: parsedSkills,
    };
  }

  return { operators };
}
