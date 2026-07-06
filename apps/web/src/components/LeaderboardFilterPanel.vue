<script setup lang="ts">
defineProps<{
  keyword: string;
  mode: "damage" | "healing";
  sortKey: "dps" | "totalDamage" | "hitDamage" | "hps" | "totalHealing";
  desc: boolean;
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "update:mode", value: "damage" | "healing"): void;
  (e: "update:sortKey", value: "dps" | "totalDamage" | "hitDamage" | "hps" | "totalHealing"): void;
  (e: "update:desc", value: boolean): void;
}>();
</script>

<template>
  <section class="wiki-callout">
    <div class="grid gap-3 md:grid-cols-4">
      <label>
        <span class="text-[0.85rem] text-arkrec-note">检索</span>
        <input
          :value="keyword"
          class="wiki-input mt-1"
          placeholder="干员名 / 技能名"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label>
        <span class="text-[0.85rem] text-arkrec-note">榜单类型</span>
        <select
          :value="mode"
          class="wiki-select mt-1"
          @change="emit('update:mode', ($event.target as HTMLSelectElement).value as 'damage' | 'healing')"
        >
          <option value="damage">伤害榜</option>
          <option value="healing">治疗榜</option>
        </select>
      </label>

      <label>
        <span class="text-[0.85rem] text-arkrec-note">排序字段</span>
        <select
          :value="sortKey"
          class="wiki-select mt-1"
          @change="emit('update:sortKey', ($event.target as HTMLSelectElement).value as 'dps' | 'totalDamage' | 'hitDamage' | 'hps' | 'totalHealing')"
        >
          <option value="dps">DPS</option>
          <option value="totalDamage">总伤</option>
          <option value="hitDamage">单次伤害</option>
          <option value="hps">HPS</option>
          <option value="totalHealing">总治疗</option>
        </select>
      </label>

      <label class="flex items-end gap-2">
        <input
          :checked="desc"
          type="checkbox"
          class="wiki-checkbox"
          @change="emit('update:desc', ($event.target as HTMLInputElement).checked)"
        />
        <span>降序</span>
      </label>
    </div>
  </section>
</template>
