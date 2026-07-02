<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  defense: number;
  magicResistance: number;
  minPhysicalDamageRatio: number;
  conditionEnabled: boolean;
}>();

const emit = defineEmits<{
  (e: "update:defense", value: number): void;
  (e: "update:magicResistance", value: number): void;
  (e: "update:minPhysicalDamageRatio", value: number): void;
  (e: "update:conditionEnabled", value: boolean): void;
}>();

const open = ref(false);
</script>

<template>
  <aside class="wiki-disclosure wiki-disclosure--attached">
    <button
      type="button"
      class="wiki-disclosure-header"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span>敌方效果</span>
      <span class="wiki-disclosure-indicator" aria-hidden="true">
        {{ open ? "−" : "+" }}
      </span>
    </button>

    <div v-show="open" class="wiki-disclosure-body">
      <table class="wiki-table wiki-table--narrow">
        <tbody>
          <tr>
            <th style="width: 40%;">敌方防御</th>
            <td>
              <input
                :value="defense"
                type="number"
                min="0"
                class="wiki-input"
                style="max-width: 160px;"
                @input="emit('update:defense', Number(($event.target as HTMLInputElement).value))"
              />
            </td>
          </tr>
          <tr>
            <th>敌方法抗</th>
            <td>
              <input
                :value="magicResistance"
                type="number"
                min="0"
                max="100"
                class="wiki-input"
                style="max-width: 160px;"
                @input="emit('update:magicResistance', Number(($event.target as HTMLInputElement).value))"
              />
            </td>
          </tr>
          <tr>
            <th>物理最低伤害比例</th>
            <td>
              <input
                :value="minPhysicalDamageRatio"
                type="number"
                min="0"
                max="1"
                step="0.01"
                class="wiki-input"
                style="max-width: 160px;"
                @input="emit('update:minPhysicalDamageRatio', Number(($event.target as HTMLInputElement).value))"
              />
            </td>
          </tr>
          <tr>
            <th>条件效果</th>
            <td>
              <label class="inline-flex items-center cursor-pointer text-[0.9rem]">
                <input
                  :checked="conditionEnabled"
                  type="checkbox"
                  class="wiki-checkbox"
                  @change="emit('update:conditionEnabled', ($event.target as HTMLInputElement).checked)"
                />
                <span>启用 (如干员天赋)</span>
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </aside>
</template>
