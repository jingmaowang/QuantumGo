<template>
  <div class="main">
    <div class="left">
      <div class="title">{{ lang.text.index.title }}</div>
      <div class="desc">
        <div class="text">{{ lang.text.index.desc }}</div>
        <div class="btn" @click="createRoom">{{ lang.text.index.btn_start }}</div>
      </div>
    </div>
    <div class="right">
      <board-component class="board" info="board1">
        <div class="round1" />
        <div class="round2" />
        <img class="hand" :src="handWithChess" alt="hand" />
      </board-component>
      <img class="chess-box" :src="chessBox" alt="chess-box" />
    </div>
    <el-dialog v-model="createRoomVisible" :title="lang.text.index.create_room_title" width="500">
      <el-form :model="form">
        <el-form-item :label="lang.text.index.game_mode_title" :label-width="'140px'">
          <el-select v-model="form.gameMode" :placeholder="lang.text.index.game_mode_placeholder">
            <el-option :label="lang.text.index.game_mode_pvp" :value="'pvp'" />
            <el-option :label="lang.text.index.game_mode_ai" :value="'ai'" />
          </el-select>
        </el-form-item>
        <el-form-item :label="lang.text.index.model_title" :label-width="'140px'">
          <el-select v-model="form.model" :placeholder="lang.text.index.model_placeholder">
            <el-option :label="lang.text.index.model_9" :value="9" />
            <el-option :label="lang.text.index.model_13" :value="13" />
            <el-option :label="lang.text.index.model_19" :value="19" />
          </el-select>
        </el-form-item>
        <el-form-item :label="lang.text.index.countdown_title" :label-width="'140px'">
          <el-select v-model="form.countdown" :placeholder="lang.text.index.countdown_placeholder">
            <el-option label="15S" :value="15" />
            <el-option label="30S" :value="30" />
            <el-option label="60S" :value="60" />
            <el-option label="90S" :value="90" />
            <el-option label="120S" :value="120" />
            <el-option label="150S" :value="150" />
            <el-option label="180S" :value="180" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createRoomVisible = false">{{ lang.text.index.cancel }}</el-button>
          <el-button type="primary" @click="createRoomSubmit">{{ lang.text.index.confirm }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import BoardComponent from "@/components/BoardComponent/index.vue";
import { useStore } from "vuex";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElForm, ElFormItem, ElDialog, ElSelect, ElOption, ElButton } from "element-plus";
import handWithChess from '@/assets/img/hand_with_chess.png'
import chessBox from '@/assets/img/chess_box.png'

const router = useRouter();
const store = useStore();
const user = computed(() => store.state.user);
const lang = computed(() => store.state.lang);

onMounted(async () => {
  await store.dispatch("game/initBoard");
});

const createRoomVisible = ref(false);
const form = reactive({
  gameMode: "pvp",
  model: "",
  countdown: ""
});

const createRoom = async () => {
  createRoomVisible.value = true;
};

const createRoomSubmit = async () => {
  const {gameMode, countdown, model} = form;
  console.log('Creating room with form data:', { gameMode, countdown, model });
  if (!gameMode || !countdown || !model) {
    ElMessage({ message: lang.value.text.index.create_room_error_empty_options, grouping: true, type: "error" });
    return;
  }
  const roomId = await store.dispatch("game/createRoom", {gameMode, countdown, model});
  if (roomId === false) {
    ElMessage({ message: lang.value.text.index.create_room_error, grouping: true, type: "error" });
    return;
  }
  await router.push(`/room/${roomId}`);
};
</script>

<style scoped lang="scss">
@use "./index.scss" as *;
</style>