<template>
  <navbar-component />
  <div class="main">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import NavbarComponent from "@/components/NavbarComponent/index.vue";

</script>

<style scoped lang="scss">
:global(body) {
  margin: 0;
  font-size: 62.5%;
  background: #FEF6EC;
  max-width: 100vw;
  max-height: 100vh;
  overflow: hidden;
}

:global(#app) {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  //position: relative;
  //background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  //background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  //background: #FEEACF99;
}
</style>
