<template>
  <div class="test-ai-page">
    <h1>AI对战测试页面</h1>
    
    <div class="test-controls">
      <button @click="createAIRoom" :disabled="isCreating">创建AI对战房间</button>
      <button @click="testAIMove" :disabled="!roomId">测试AI移动</button>
      <button @click="resetTest">重置测试</button>
    </div>
    
    <div class="test-info">
      <h3>测试信息</h3>
      <p><strong>房间ID:</strong> {{ roomId || '未创建' }}</p>
      <p><strong>游戏模式:</strong> {{ gameMode }}</p>
      <p><strong>游戏状态:</strong> {{ gameStatus }}</p>
      <p><strong>当前回合:</strong> {{ currentRound }}</p>
      <p><strong>玩家阵营:</strong> {{ playerCamp }}</p>
      <p><strong>移动次数:</strong> {{ moves }}</p>
    </div>
    
    <div class="test-logs">
      <h3>测试日志</h3>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import api from '@/utils/api';

const store = useStore();
const roomId = ref('');
const isCreating = ref(false);
const logs = ref<string[]>([]);

// 从store获取游戏状态
const gameMode = computed(() => store.state.game.gameMode);
const gameStatus = computed(() => store.state.game.status);
const currentRound = computed(() => store.state.game.round ? '黑方' : '白方');
const playerCamp = computed(() => store.state.game.camp);
const moves = computed(() => store.state.game.moves);

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.push(`[${timestamp}] ${message}`);
  console.log(message);
};

const createAIRoom = async () => {
  try {
    isCreating.value = true;
    addLog('开始创建AI对战房间...');
    
    const response = await api.createRoom(
      store.state.user.id,
      9, // 9x9棋盘
      30, // 30秒倒计时
      'ai' // AI模式
    );
    
    if (response.success) {
      roomId.value = response.data.room_id;
      addLog(`AI对战房间创建成功! 房间ID: ${roomId.value}`);
      
      // 获取房间信息
      const gameInfo = await api.getGameInfo(roomId.value);
      if (gameInfo.success) {
        addLog(`房间信息获取成功: ${JSON.stringify(gameInfo.data)}`);
        
        // 设置游戏信息
        await store.dispatch('game/setGameInfo', gameInfo.data);
        addLog('游戏信息已设置到store');
      } else {
        addLog(`获取房间信息失败: ${JSON.stringify(gameInfo)}`);
      }
    } else {
      addLog(`创建房间失败: ${JSON.stringify(response)}`);
    }
  } catch (error) {
    addLog(`创建房间异常: ${error}`);
  } finally {
    isCreating.value = false;
  }
};

const testAIMove = async () => {
  if (!roomId.value) {
    addLog('请先创建房间');
    return;
  }
  
  try {
    addLog('开始测试AI移动...');
    
    const response = await api.aiMove(roomId.value, store.state.user.id);
    addLog(`AI移动API响应: ${JSON.stringify(response)}`);
    
    if (response.success) {
      const aiMove = response.data.ai_move;
      addLog(`AI移动成功: 位置=${aiMove.position}, 类型=${aiMove.type}`);
      
      // 模拟AI落子
      await store.dispatch('game/putChess', {
        position: aiMove.position,
        type: aiMove.type
      });
      addLog('AI落子已添加到棋盘');
    } else {
      addLog(`AI移动失败: ${JSON.stringify(response)}`);
    }
  } catch (error) {
    addLog(`AI移动异常: ${error}`);
  }
};

const resetTest = () => {
  roomId.value = '';
  logs.value = [];
  store.commit('game/initBoard');
  addLog('测试已重置');
};

// 监听store变化
store.watch(
  (state) => state.game,
  (newGame, oldGame) => {
    if (newGame.gameMode !== oldGame?.gameMode) {
      addLog(`游戏模式变化: ${oldGame?.gameMode} -> ${newGame.gameMode}`);
    }
    if (newGame.status !== oldGame?.status) {
      addLog(`游戏状态变化: ${oldGame?.status} -> ${newGame.status}`);
    }
    if (newGame.round !== oldGame?.round) {
      addLog(`回合变化: ${oldGame?.round ? '黑方' : '白方'} -> ${newGame.round ? '黑方' : '白方'}`);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.test-ai-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-controls {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.test-controls button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

.test-controls button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.test-controls button:hover:not(:disabled) {
  background-color: #0056b3;
}

.test-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
}

.test-info p {
  margin: 5px 0;
}

.test-logs {
  margin: 20px 0;
}

.log-container {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.log-entry {
  font-family: monospace;
  font-size: 12px;
  margin: 2px 0;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}
</style>
