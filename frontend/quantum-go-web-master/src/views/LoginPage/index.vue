<template>
  <div class="model">
    <div class="auth-tabs">
      <button class="tab" :class="{ active: isLogin }" @click="isLogin = true">{{ lang.text.login.title_login }}</button>
      <button class="tab" :class="{ active: !isLogin }" @click="isLogin = false">{{ lang.text.login.title_register }}</button>
    </div>
    <form class="auth-form" @submit.prevent="handleSubmit">
      <div class="input-group">
        <label>{{ lang.text.login.label_name }}</label>
        <input v-model="formData.user_name" type="text" :placeholder="lang.text.login.placeholder_name" required>
      </div>
      <div class="input-group">
        <label>{{ lang.text.login.label_password }}</label>
        <input v-model="formData.user_password" type="password" :placeholder="lang.text.login.placeholder_password" required>
      </div>
      <div class="input-group" v-if="!isLogin">
        <label>{{ lang.text.login.label_password_confirm }}</label>
        <input v-model="formData.confirm_password" type="password" :placeholder="lang.text.login.placeholder_password_confirm" required>
      </div>

      <button class="submit-btn" type="submit">{{ isLogin ? lang.text.login.btn_login : lang.text.login.btn_register }}</button>
      
      <!-- 开发测试按钮 -->
      <button type="button" class="test-btn" @click="testConnection" style="margin-top: 10px; background: #409eff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
        测试 Supabase 连接
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { testSupabaseConnection, testUsersTable } from "@/utils/supabase-connection-test";

const router = useRouter();
const store = useStore();
const user = computed(() => store.state.user);
const lang = computed(() => store.state.lang);

const isLogin = ref(true);
const formData = reactive({
  user_name: "",
  user_password: "",
  confirm_password: ""
});

watch(
  () => user.value.isLogin,
  () => {
    ElMessage.success({ message: lang.value.text.login.login_success + user.value.name, grouping: true });
    router.push('/');
  }
);

const handleSubmit = async () => {
  if (!isLogin.value && formData.user_password !== formData.confirm_password) {
    ElMessage.warning({ message: lang.value.text.login.password_not_confirm, grouping: true });
    return;
  }
  if (isLogin.value) {
    const res = await store.dispatch("user/login", {
      user_name: formData.user_name,
      password: formData.user_password
    });
    if (!res.success) {
      ElMessage.warning({ message: lang.value.text.login.login_error, grouping: true });
      return;
    } else {
      ElMessage.success({ message: lang.value.text.login.login_success + res.data.user_name, grouping: true });
      await router.push('/');
    }
  } else {
    const res = await store.dispatch("user/register", {
      user_name: formData.user_name,
      password: formData.user_password
    });
    if (!res.success) {
      ElMessage.warning({ message: lang.value.text.login.register_error, grouping: true });
      return;
    } else {
      ElMessage.success({ message: lang.value.text.login.login_success + res.data.user_name, grouping: true });
      await router.push('/');
    }
  }
};

// 测试 Supabase 连接
const testConnection = async () => {
  try {
    ElMessage.info({ message: "正在测试 Supabase 连接...", grouping: true });
    
    // 测试基本连接
    const connectionResult = await testSupabaseConnection();
    if (!connectionResult.success) {
      ElMessage.error({ message: `连接失败: ${connectionResult.error}`, grouping: true });
      return;
    }
    
    // 测试用户表
    const tableResult = await testUsersTable();
    if (!tableResult.success) {
      ElMessage.error({ message: `用户表访问失败: ${tableResult.error}`, grouping: true });
      return;
    }
    
    ElMessage.success({ message: "✅ Supabase 连接测试成功！", grouping: true });
  } catch (error: any) {
    ElMessage.error({ message: `测试失败: ${error.message}`, grouping: true });
  }
};
</script>

<style scoped lang="scss">
@use "./index.scss" as *;
</style>