<template>
  <div class="main">
    <div v-if="(game.status === 'playing' || game.gameMode === 'ai') && (wsStatus || game.gameMode === 'ai')" class="operation">
      <div class="item btn" @click="passChess">{{ lang.text.room.pass }}</div>
      <div class="item btn" @click="backChess">{{ lang.text.room.takeback }}</div>
      <!--      <div class="btn">{{ lang.text.room.draw }}</div>-->
      <div class="item btn" @click="resign">{{ lang.text.room.resign }}</div>
      <div class="item score">
        <div>
          <span class="label">{{ lang.text.room.moves }}</span>
          <span class="value animate-count no-chess">{{ game.moves }}</span>
        </div>
        <div>
          <span class="label">{{ lang.text.room.points }}</span>
          <span class="value black animate-count">{{ game.blackLost }}</span>
          <span class="value white animate-count">{{ game.whiteLost }}</span>
        </div>
        <div>
          <span class="label">{{ lang.text.room.score }}</span>
          <span class="value black animate-count">{{ game.blackPoints }}</span>
          <span class="value white animate-count">{{ game.whitePoints }}</span>
        </div>
      </div>
    </div>
    <div class="body">
      <div class="battle">
        <div class="board-box">
          <board-component class="board" info="board1" :can="wsStatus || game.gameMode === 'ai'" :callback="putChess" />
        </div>
        <div class="board-box">
          <board-component class="board" info="board2" :can="wsStatus || game.gameMode === 'ai'" :callback="putChess" />
        </div>
      </div>
      <div class="input-box">
        <input class="input" v-model="input" type="text" :placeholder="lang.text.room.chat_placeholder" @keyup.enter="sendMessage" />
      </div>
    </div>
    <el-progress class="progress" v-show="progress > 0" type="circle" striped striped-flow :percentage="progress" :color="progressColors" :format="progressLabel" />
    <barrage-component ref="barrage" />
    <el-dialog v-model="backApply" :title="lang.text.room.back_apply_title" width="500">
      <span>{{ lang.text.room.back_apply_content }}</span>
      <template #footer>
        <div>
          <el-button @click="backApplyOperation(false)">{{ lang.text.room.back_apply_btn_reject }}</el-button>
          <el-button type="primary" @click="backApplyOperation(true)">{{ lang.text.room.back_apply_btn_agree }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import BoardComponent from "@/components/BoardComponent/index.vue";
import BarrageComponent from "@/components/BarrageComponent/index.vue";
import { useStore } from "vuex";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/utils/api";
import { ElMessage, ElMessageBox, ElProgress, ElLoading, ElDialog, ElButton } from "element-plus";
import { Chessman } from "@/utils/types";
import { canPutChess } from "@/utils/chess";
import Config from "@/config";

const route = useRoute();
const router = useRouter();

const store = useStore();
const user = computed(() => store.state.user);
const game = computed(() => store.state.game);
const lang = computed(() => store.state.lang);

const barrage = ref();

let ws: any;
const wsStatus = ref(false);

let roomId: string;
onMounted(async () => {
  roomId = route.params.id as string;
  const res = await api.getGameInfo(roomId);
  console.log(res);
  const redirectToHomeWithMessage = (message: string) => {
    ElMessage.error(message);
    router.push("/");
  };
  if (!res.success) {
    if (res.status === 0) {
      redirectToHomeWithMessage(lang.value.text.join.net_error);
    } else {
      redirectToHomeWithMessage(lang.value.text.join.room_not_found);
    }
    return;
  }
  const data = res.data;
  if (data.status === "finish") {
    redirectToHomeWithMessage(lang.value.text.join.room_finished);
  } else if (data.status === "playing" || data.gameMode === "ai") {
    // AI对战模式或者普通对战模式
    if (data.gameMode !== "ai" && user.value.id !== data.owner_id && data.visitor_id && user.value.id !== data.visitor_id) {
      redirectToHomeWithMessage(lang.value.text.join.room_playing);
    }
  }
  await initGame(res.data);
});
onMounted(() => {
  ws?.close();
});

const initGame = async (data: Record<string, any>) => {
  await store.dispatch("game/setGameInfo", data);
  console.log("Initializing game with data:", data);
  
  // 判断是否是AI对战房间：visitor_id为特殊UUID且status为playing
  // 或者从URL参数中判断是否是AI模式
  const isAIGame = data.visitor_id === "00000000-0000-0000-0000-000000000000" && data.status === "playing";
  console.log("Is AI game:", isAIGame, "visitor_id:", data.visitor_id, "status:", data.status);
  
  // 如果从URL参数判断是AI模式，强制设置为AI模式
  const urlParams = new URLSearchParams(window.location.search);
  const gameModeFromUrl = urlParams.get('gameMode');
  if (gameModeFromUrl === 'ai') {
    console.log("AI mode detected from URL parameter");
    store.commit("game/setGameMode", "ai");
    store.commit("game/setStatus", "playing");
    store.commit("game/setRound", true);
    wsStatus.value = true;
    console.log("AI mode initialized from URL, wsStatus set to:", wsStatus.value);
    return;
  }
  
  // 检查房间是否是从AI模式创建的
  // 如果房间刚刚创建且没有访客，可能是AI房间
  if (data.visitor_id === null && data.status === "waiting" && data.moves === 0) {
    // 检查是否是从AI模式创建的
    const roomCreationInfo = sessionStorage.getItem(`room_${data.room_id}_mode`);
    if (roomCreationInfo === 'ai') {
      console.log("AI mode detected from session storage");
      store.commit("game/setGameMode", "ai");
      store.commit("game/setStatus", "playing");
      store.commit("game/setRound", true);
      wsStatus.value = true;
      console.log("AI mode initialized from session storage, wsStatus set to:", wsStatus.value);
      return;
    }
  }
  
  if (isAIGame) {
    console.log("AI battle room detected, setting game status to playing");
    // 强制设置游戏模式为AI
    store.commit("game/setGameMode", "ai");
    // 强制设置游戏状态为playing
    store.commit("game/setStatus", "playing");
    // 设置玩家为黑方，AI为白方
    store.commit("game/setRound", true); // 黑方先手
    // 允许下棋
    wsStatus.value = true;
    console.log("AI mode initialized, wsStatus set to:", wsStatus.value, "game mode:", store.state.game.gameMode);
    return;
  }
  
  // 普通PVP模式，使用 Supabase 实时功能
  console.log("PVP mode detected, using Supabase real-time");
  wsStatus.value = true; // 直接设置为可用，因为使用 Supabase
  
  // 设置 Supabase 实时监听房间变化
  const supabase = (window as any).supabase || null;
  if (supabase) {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'room_infos',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload: any) => {
          console.log('Room updated:', payload);
          // 处理房间更新
          if (payload.new) {
            store.dispatch("game/setGameInfo", payload.new);
          }
        }
      )
      .subscribe();
    
    // 保存 channel 引用以便清理
    (window as any).roomChannel = channel;
  }
  
  // WebSocket 消息处理已移除，现在使用 Supabase 实时功能
};

const putChess = async (position: string) => {
  clearInterval(timer);
  progress.value = 0;
  
  console.log("putChess called with position:", position, "gameMode:", game.value.gameMode, "round:", game.value.round, "status:", game.value.status);
  
  // 如果是AI对战模式，直接处理下棋逻辑
  if (game.value.gameMode === "ai") {
    console.log("AI mode: processing chess move at position:", position);
    
    // 检查是否是玩家的回合
    if (!game.value.round) {
      ElMessage.warning({ message: lang.value.text.room.not_round, grouping: true });
      return;
    }
    
    // 检查位置是否已经有棋子
    if (game.value.board1.has(position) || game.value.board2.has(position)) {
      console.log("AI mode: position already occupied");
      return;
    }
    
    console.log("AI mode: attempting to place chess at", position, "camp:", game.value.camp);
    
    // 直接更新游戏状态
    const success = await store.dispatch("game/putChess", { position, type: game.value.camp });
    if (success) {
      console.log("AI mode: chess placed successfully");
      // AI的响应会在store的putChess方法中处理
    } else {
      console.log("AI mode: failed to place chess");
      // 不要显示错误消息，因为这可能是正常的验证失败
      // ElMessage.error("Failed to place chess");
    }
    return;
  }
  
  // 普通PVP模式，使用 Supabase 处理
  if (!wsStatus.value) {
    ElMessage.warning({ message: "连接错误", grouping: true });
    return;
  }
  
  // 检查位置是否已经有棋子
  if (game.value.board1.has(position) || game.value.board2.has(position)) {
    console.log("PVP mode: position already occupied");
    return;
  }
  
  // 直接使用 Supabase 处理下棋
  const success = await store.dispatch("game/putChess", { position, type: game.value.camp });
  if (success) {
    console.log("PVP mode: chess placed successfully");
  } else {
    console.log("PVP mode: failed to place chess");
  }
  
  // WebSocket 发送已移除，现在使用 Supabase
};

const isWaitingBack = ref(false);
let loadingModel: any;
const backChess = async () => {
  // 如果是AI对战模式，直接处理
  if (game.value.gameMode === "ai") {
    if (!game.value.round) {
      ElMessage.warning({ message: lang.value.text.room.not_round, grouping: true });
      return;
    }
    if (game.value.records.length < 4) {
      ElMessage.warning({ message: lang.value.text.room.back_apply_early, grouping: true });
      return;
    }
    // AI模式下直接悔棋
    await store.dispatch("game/backChess");
    ElMessage.success(lang.value.text.room.back_apply_success);
    return;
  }
  
  // 普通PVP模式
  if (!wsStatus.value) {
    ElMessage.warning({ message: lang.value.text.room.ws_connection_error, grouping: true });
    return;
  }
  if (!game.value.round) {
    ElMessage.warning({ message: lang.value.text.room.not_round, grouping: true });
    return;
  }
  if (game.value.records.length < 4) {
    ElMessage.warning({ message: lang.value.text.room.back_apply_early, grouping: true });
    return;
  }
  isWaitingBack.value = true;
  loadingModel = ElLoading.service({ target: "body", text: lang.value.text.room.back_apply_waiting, background: "rgba(0, 0, 0, 0.2)" });
  ws.send(JSON.stringify({ type: "backChessApply", data: {} }));
};
const backApply = ref(false);
const backApplyOperation = async (operation: boolean) => {
  backApply.value = false;
  ws.send(JSON.stringify({ type: "backChessResult", data: { operation } }));
  if (operation) {
    await store.dispatch("game/backChess");
  }
};

const passChess = () => {
  // 如果是AI对战模式，直接处理
  if (game.value.gameMode === "ai") {
    if (!game.value.round) {
      ElMessage.warning({ message: lang.value.text.room.not_round, grouping: true });
      return;
    }
    if (game.value.board1.size <= 2) {
      ElMessage.warning({ message: lang.value.text.room.pass_early, grouping: true });
      return;
    }
    clearInterval(timer);
    progress.value = 0;
    console.log("AI mode: passChess");
    store.commit("game/setRound", false);
    game.value.moves++;
    return;
  }
  
  // 普通PVP模式
  if (!wsStatus.value) {
    ElMessage.warning({ message: lang.value.text.room.ws_connection_error, grouping: true });
    return;
  }
  if (!game.value.round) {
    ElMessage.warning({ message: lang.value.text.room.not_round, grouping: true });
    return;
  }
  if (game.value.board1.size <= 2) {
    ElMessage.warning({ message: lang.value.text.room.pass_early, grouping: true });
    return;
  }
  clearInterval(timer);
  progress.value = 0;
  console.log("passChess");
  const chessman: Chessman = { position: "0,0", type: game.value.camp, brother: "0,0" };
  ws.send(JSON.stringify({
    type: "updateChess", data: {
      putChess: chessman,
      board: [...game.value.board1],
      black_lost: 0, white_lost: 0,
      chessman_records:
      game.value.records
    }
  }));
  store.commit("game/setRound", false);
  game.value.moves++;
};

const resign = () => {
  // 如果是AI对战模式，直接处理
  if (game.value.gameMode === "ai") {
    store.commit("game/setRound", false);
    store.commit("game/setStatus", "finished");
    ElMessageBox.alert(lang.value.text.room.loser, "Finish", { confirmButtonText: "OK" });
    return;
  }
  
  // 普通PVP模式
  if (!wsStatus.value) {
    ElMessage.warning({ message: lang.value.text.room.ws_connection_error, grouping: true });
    return;
  }
  ws.send(JSON.stringify({ type: "setWinner", data: { winner: game.value.camp === "black" ? "white" : "black" } }));
  store.commit("game/setRound", false);
  store.commit("game/setStatus", "finished");
  ElMessageBox.alert(lang.value.text.room.loser, "Finish", { confirmButtonText: "OK" });
};

const input = ref("");
const sendMessage = async () => {
  if (!input.value) {
    return;
  }
  const message = input.value;
  input.value = "";
  ws?.send(JSON.stringify({ type: "sendMessage", data: { message } }));
  barrage.value.sendBullet(message, 0);
};

const progressColors = ref([
  { color: "#f56c6c", percentage: 30 },
  { color: "#e6a23c", percentage: 60 },
  { color: "#5cb87a", percentage: 100 }
]);
const progressLabel = (percentage: number) => {
  return `${Math.floor(percentage / 100 * game.value.countdown)}S`;
};

const progress = ref(0);
let timer: NodeJS.Timeout;
</script>

<style scoped lang="scss">
@use "./index.scss" as *;
</style>