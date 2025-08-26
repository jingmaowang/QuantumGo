<template>
  <div class="main">
    <div v-if="game.status === 'playing'" class="operation">
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
          <board-component class="board" info="board1" :can="wsStatus" :callback="putChess" />
        </div>
        <div class="board-box">
          <board-component class="board" info="board2" :can="wsStatus" :callback="putChess" />
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
  } else if (data.status === "playing") {
    if (user.value.id !== data.owner_id && user.value.id !== data.visitor_id) {
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
  console.log(data);
  ws = new WebSocket(`${Config.wsUrl}/${user.value.id}/${roomId}`);
  // ws = io(`ws://${window.location.hostname}/ws/${user.value.id}/${roomId}`);
  console.log(ws);
  ws.onopen = () => {
    console.log("Connected to WebSocket server");
    wsStatus.value = true;
  };
  ws.onclose = () => {
    wsStatus.value = false;
    ElMessage.warning(lang.value.text.room.ws_disconnected);
    console.log("WebSocket connection closed");
  };
  ws.onerror = (error: any) => {
    ElMessage.warning(lang.value.text.room.ws_disconnected);
    console.error("WebSocket error:", error);
  };
  ws.onmessage = (event: any) => {
    const message = event.data;
    console.log("Received message:", message);
    const data = JSON.parse(message);
    if (data.type === "updateChess") {
      game.value.moves++;
      const chessman = data.data.putChess as Chessman;
      console.log(chessman);
      if (chessman.position !== "0,0") {
        store.dispatch("game/putChess", chessman);
      }
      store.commit("game/setRound", true);
      progress.value = 100;
      timer = setInterval(() => {
        if (isWaitingBack.value === true) {
          return;
        }
        const reduce = 0.1 / game.value.countdown * 100;
        if (progress.value > reduce) {
          progress.value -= 0.1 / game.value.countdown * 100;
        } else {
          progress.value = 0;
          passChess();
          ElMessage.warning(lang.value.text.room.time_up);
          clearInterval(timer);
        }
      }, 100);
      let status = false;
      for (let i = 0; i < 81; i++) {
        const x = Math.floor((i - 1) / 9) + 1;
        const y = (i - 1) % 9 + 1;
        const position = `${x},${y}`;
        if (canPutChess(game.value.board1, position, chessman.type, game.value.model) || canPutChess(game.value.board2, position, chessman.type, game.value.model)) {
          status = true;
          break;
        }
      }
      if (!status) {
        let winner: string;
        if (game.value.blackPoints - game.value.whiteLost - 7 > 0) {
          winner = "black";
        } else {
          winner = "white";
        }
        ws.send(JSON.stringify({ type: "setWinner", data: { winner: winner } }));
        if (winner === game.value.camp) {
          ElMessageBox.alert(lang.value.text.room.winner, "Finish", { confirmButtonText: "OK" });
        } else {
          ElMessageBox.alert(lang.value.text.room.loser, "Finish", { confirmButtonText: "OK" });
        }
      }
    } else if (data.type === "startGame") {
      game.value.status = "playing";
      ElMessage.success(lang.value.text.room.start_game);
    } else if (data.type === "setWinner") {
      store.commit("game/setStatus", "finished");
      store.commit("game/setRound", false);
      const winner = data.data.winner;
      if (winner === game.value.camp) {
        ElMessageBox.alert(lang.value.text.room.winner, "Finish", { confirmButtonText: "OK" });
      } else {
        ElMessageBox.alert(lang.value.text.room.loser, "Finish", { confirmButtonText: "OK" });
      }
    } else if (data.type === "updateRoomInfo") {
      store.dispatch("game/updateRoomInfo", data.data);
    } else if (data.type === "sendMessage") {
      barrage.value.sendBullet(data.data.message, 1);
    } else if (data.type === "backChessApply") {
      backApply.value = true;
    } else if (data.type === "backChessResult") {
      const operation = data.data.operation;
      isWaitingBack.value = false;
      loadingModel.close();
      if (operation) {
        ElMessage.success(lang.value.text.room.back_apply_success);
        store.dispatch("game/backChess", data.data.chessman);
      } else {
        ElMessage.warning(lang.value.text.room.back_apply_fail);
      }
    }
  };
};

const putChess = async (position: string) => {
  clearInterval(timer);
  progress.value = 0;
  game.value.moves++;
  if (!wsStatus.value) {
    ElMessage.warning({ message: lang.value.text.room.ws_connection_error, grouping: true });
    return;
  }
  const chessman: Chessman = game.value.board1.get(position);
  ws.send(JSON.stringify({
    type: "updateChess",
    data: {
      putChess: chessman,
      board: [...game.value.board1],
      black_lost: game.value.blackLost,
      white_lost: game.value.whiteLost,
      chessman_records: game.value.records
    }
  }));
};

const isWaitingBack = ref(false);
let loadingModel: any;
const backChess = async () => {
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