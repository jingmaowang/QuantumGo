<template>
  <GameStatus
    :status-text="当前状态"
    :countdown="remainingTime"
    :show-result="showResultModal"
    :result-text="对局结果"
    :total-moves="totalSteps"
  />
</template>

<script setup lang="ts">
import GameStatus from "@/components/test/index.vue";
import { ref } from "vue";

const remainingTime = ref(30);
setInterval(() => {
  remainingTime.value--;
}, 1000);
const totalSteps = ref(10);
</script>

<style scoped lang="scss">
</style>