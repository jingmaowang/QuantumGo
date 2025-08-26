<template>
  <nav class="navbar">
    <div class="logo" @click="logoClick">{{ lang.text.navbar.logo }}</div>
    <div class="nav-right">
      <button class="nav-button" @click="changeLanguage">
        <!--        <t-icon name="translate-1" />-->
        <span>{{ lang.text.navbar.lang }}</span>
      </button>
      <button class="nav-button" @click="goToLeaderboard">
        <!--        <t-icon name="trophy" />-->
        <span>{{ lang.text.navbar.leaderboard }}</span>
      </button>
      <button class="nav-button" @click="handleShare">
        <!--        <t-icon name="share" />-->
        <span>{{ lang.text.navbar.share }}</span>
      </button>
      <button class="nav-button" @click="handleLogin">
        <!--        <t-icon name="share" />-->
        <span>{{ user.isLogin ? user.name : lang.text.navbar.login }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";
import { copyText } from "@/utils/tools";
import { useRouter } from 'vue-router';

const store = useStore();
const lang = computed(() => store.state.lang);
const user = computed(() => store.state.user);
const router = useRouter();

const logoClick = () => {
  router.push('/');
};

const changeLanguage = () => {
  store.commit("lang/changeLanguage");
};

const goToLeaderboard = () => {
  router.push('/leaderboard');
};

const handleShare = async () => {
  const roomId = store.state.game.roomId;
  if (roomId) {
    await copyText(store.state.lang.text.navbar.share_battle + window.location.origin + `/room/${roomId}`);
  } else {
    await copyText(store.state.lang.text.navbar.share_website + window.location.origin);
  }
  ElMessage({ message: lang.value.text.navbar.copy_success, grouping: true, type: "success" });
};

const handleLogin = () => {
  if (user.value.isLogin) {
    return;
  }
  router.push('/login');
};
</script>

<style scoped lang="scss">  
@use "./index.scss" as *;
</style>