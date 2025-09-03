<template>
  <div :class="['container', {'board-hover': board.boardHover}]" v-bind="$attrs" @mouseover="onBoardHover" @mouseleave="onBoardUnhover">
    <slot />
    <canvas class="board" ref="canvas" />
    <div class="chessman-box" :style="{gridTemplateColumns: `repeat(${game.model}, 1fr)`,gridTemplateRows: `repeat(${game.model}, 1fr)`}">
      <div class="chessman" v-for="index in game.model * game.model" :key="index">
        <template v-if="info.has(getPositionStr(index))">
          <div :class="['quantum', info.get(getPositionStr(index)).type]" v-if="info.get(getPositionStr(index)).position !== info.get(getPositionStr(index)).brother">
            <div :class="['background', `q-${info.get(getPositionStr(index)).type}`,{reserve: info.get(getPositionStr(index)).type === 'white'}]" />
          </div>
          <div :class="['black', {last: lastChess.black === getPositionStr(index)}]" v-else-if="info.get(getPositionStr(index)).type === 'black'" />
          <div :class="['white', {last: lastChess.white === getPositionStr(index)}]" v-else />
        </template>
        <div :class="['empty', game.camp, ((game.round || !game.roomId) && game.status !== 'finished') ? 'allowed' : '', board.hoverIndex === index ? 'hover' :'']"
             v-else @click="putChess(index)" @mouseover="onHover(index)" @mouseleave="onUnhover" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";
import { BoardModel, ChessmanRecord } from "@/utils/types";
import textureImgPath from "@/assets/img/board_bg2.png";

const props = defineProps({
  info: {
    type: String,
    required: true
  },
  can: {
    type: Boolean,
    default: true
  },
  callback: {
    type: Function,
    default: () => false
  }
});
const store = useStore();
const lang = computed(() => store.state.lang);
const board = computed(() => store.state.board);
const game = computed(() => store.state.game);

const lastChess = computed(() => {
  const result = { black: "", white: "" };
  const lastWhite = game.value.records.filter((item: ChessmanRecord) => item.add[0].type === "white").pop();
  if (lastWhite) {
    if (props.info === "board1") {
      result.white = lastWhite.add[0].position;
    } else {
      result.white = lastWhite.add[0].brother;
    }
  }
  const lastBlack = game.value.records.filter((item: ChessmanRecord) => item.add[0].type === "black").pop();
  if (lastBlack) {
    if (props.info === "board1") {
      result.black = lastBlack.add[0].position;
    } else {
      result.black = lastBlack.add[0].brother;
    }
  }
  return result;
});


const onBoardHover = () => {
  store.commit("board/setBoardHover", true);
};
const onBoardUnhover = () => {
  store.commit("board/setBoardHover", false);
};


const onHover = (index: number) => {
  store.commit("board/setHoverIndex", index);
};
const onUnhover = () => {
  store.commit("board/setHoverIndex", -1);
};

const info = game.value[props.info];
const getPositionStr = (n: number) => {
  const x = Math.floor((n - 1) / game.value.model) + 1;
  const y = (n - 1) % game.value.model + 1;
  return `${x},${y}`;
};

const canvas = ref();

const generateBoard = () => {
  canvas.value.width = game.value.model * 100;
  canvas.value.height = game.value.model * 100;
  const ctx = canvas.value.getContext("2d");
  const textureImg = new Image();
  textureImg.src = textureImgPath;
  textureImg.onload = function() {
    ctx.globalAlpha = 0;
    ctx.drawImage(textureImg, 0, 0, canvas.value.width, canvas.value.height);
    ctx.background = "#FDEACF";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#EB894F99";
    ctx.fillStyle = "#EB894F";
    for (let i = 1; i <= game.value.model; i++) {
      ctx.moveTo(50, 100 * i - 50);
      ctx.lineTo(canvas.value.width - 50, 100 * i - 50);
      ctx.stroke();
      ctx.moveTo(100 * i - 50, 50);
      ctx.lineTo(100 * i - 50, canvas.value.width - 50);
      ctx.stroke();
    }
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50, canvas.value.width - 50);
    ctx.lineTo(canvas.value.width - 50, canvas.value.width - 50);
    ctx.lineTo(canvas.value.width - 50, 50);
    ctx.closePath();
    ctx.stroke();
    const p = {
      9: [250, 450, 650],
      13: [350, 650, 950],
      19: [350, 950, 1550]
    };
    const points = p[game.value.model as BoardModel];
    points.forEach((x) => {
      points.forEach((y) => {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };
};
onMounted(() => generateBoard());
watch(() => game.value.model, () => generateBoard());

const putChess = async (index: number) => {
  if (!props.can) {
    ElMessage.warning({ message: lang.value.text.board.ws_connection_error, grouping: true });
    return;
  }
  
  // 检查游戏状态和回合
  if (game.value.status === "finished") {
    console.log("Cannot place chess: game is finished");
    ElMessage.warning({ message: "Game is finished", grouping: true });
    return;
  }
  
  if (game.value.status === "waiting" && game.value.gameMode === "pvp") {
    console.log("Cannot place chess: waiting for second player to join");
    ElMessage.warning({ message: "Waiting for second player to join", grouping: true });
    return;
  }
  
  if (!game.value.round) {
    console.log("Cannot place chess: not your turn, round=", game.value.round, "status=", game.value.status, "gameMode=", game.value.gameMode);
    ElMessage.warning({ message: "It's not your turn now", grouping: true });
    return;
  }
  
  let position = getPositionStr(index);
  if (game.value.board1.has(position) || game.value.board2.has(position)) {
    console.log("Position already occupied:", position);
    ElMessage.warning({ message: lang.value.text.board.put_chess_error, grouping: true });
    return;
  }
  
  console.log("Placing chess at position:", position, "game mode:", game.value.gameMode);
  
  // 调用父组件的回调函数，让父组件处理下棋逻辑
  props.callback(position);
};
</script>

<style scoped lang="scss">
@use "./index.scss" as *;
</style>