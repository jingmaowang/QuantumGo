<template>
  <div class="bullet-container" ref="containerRef" />
</template>

<script setup lang="ts">
import { ref } from "vue";

const containerRef = ref<HTMLElement | null>(null);
const sendBullet = (message: string, model: number) => {
  const bullet = document.createElement("div");
  bullet.className = "bullet";
  bullet.textContent = message;
  bullet.style.top = `${Math.random() * 20}%`;
  bullet.addEventListener("animationend", () => bullet.remove());
  if (model === 0) {
    bullet.classList.add("color-a");
  } else {
    bullet.classList.add("color-b");
  }
  containerRef.value?.appendChild(bullet);
  bullet.classList.add("animation");
};
defineExpose({ sendBullet });
</script>

<style scoped lang="scss">
@use "./index.scss" as *;
</style>