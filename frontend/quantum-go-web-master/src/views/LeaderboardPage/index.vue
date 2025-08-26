<template>
  <div class="leaderboard-page">
    <div class="header">
      <h1>{{ lang.text.leaderboard.title }}</h1>
      <p>{{ lang.text.leaderboard.subtitle }}</p>
    </div>

    <div class="model-selector">
      <button 
        v-for="model in models" 
        :key="model"
        :class="['model-btn', { active: selectedModel === model }]"
        @click="selectModel(model)"
      >
        {{ model }}×{{ model }}
      </button>
    </div>

    <div class="leaderboard-container">
      <div v-if="loading" class="loading">
        <el-loading :fullscreen="false" />
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else-if="leaderboard.length === 0" class="empty">
        {{ lang.text.leaderboard.no_data }}
      </div>
      
      <div v-else class="leaderboard-table">
        <div class="table-header">
          <div class="col-rank">{{ lang.text.leaderboard.rank }}</div>
          <div class="col-username">{{ lang.text.leaderboard.username }}</div>
          <div class="col-rating">{{ lang.text.leaderboard.rating }}</div>
          <div class="col-rd">{{ lang.text.leaderboard.rd }}</div>
          <div class="col-games">{{ lang.text.leaderboard.games }}</div>
          <div class="col-winrate">{{ lang.text.leaderboard.win_rate }}</div>
        </div>
        
        <div 
          v-for="(entry, index) in leaderboard" 
          :key="`${entry.username}-${selectedModel}`"
          class="table-row"
        >
          <div class="col-rank">
            <span class="rank-badge" :class="getRankClass(index + 1)">
              {{ index + 1 }}
            </span>
          </div>
          <div class="col-username">{{ entry.username }}</div>
          <div class="col-rating">{{ Math.round(entry.rating) }}</div>
          <div class="col-rd">{{ Math.round(entry.rd) }}</div>
          <div class="col-games">{{ entry.games_played }}</div>
          <div class="col-winrate">{{ calculateWinRate(entry).toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <div class="stats-info">
      <div class="stat-item">
        <span class="stat-label">{{ lang.text.leaderboard.total_players }}:</span>
        <span class="stat-value">{{ leaderboard.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ lang.text.leaderboard.avg_rating }}:</span>
        <span class="stat-value">{{ averageRating }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { ElLoading } from 'element-plus';
import api from '@/utils/api';

const store = useStore();
const lang = computed(() => store.state.lang);

const models = [9, 13, 19];
const selectedModel = ref(13);
const leaderboard = ref<Array<{
  username: string;
  rating: number;
  rd: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
}>>([]);
const loading = ref(false);
const error = ref('');

const averageRating = computed(() => {
  if (leaderboard.value.length === 0) return 0;
  const total = leaderboard.value.reduce((sum, entry) => sum + entry.rating, 0);
  return Math.round(total / leaderboard.value.length);
});

const selectModel = async (model: number) => {
  selectedModel.value = model;
  await fetchLeaderboard();
};

const fetchLeaderboard = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.getLeaderboard(selectedModel.value);
    if (response.success && Array.isArray(response.data)) {
      leaderboard.value = response.data;
    } else {
      error.value = response.data?.error || 'Failed to fetch leaderboard';
    }
  } catch (err) {
    error.value = 'Network error occurred';
    console.error('Error fetching leaderboard:', err);
  } finally {
    loading.value = false;
  }
};

const getRankClass = (rank: number) => {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'normal';
};

const calculateWinRate = (entry: any) => {
  if (entry.games_played === 0) return 0;
  return (entry.wins / entry.games_played) * 100;
};

onMounted(() => {
  fetchLeaderboard();
});
</script>

<style scoped lang="scss">
.leaderboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #2c3e50;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 2.5rem;
    color: #2c3e50;
    margin-bottom: 10px;
    font-weight: 700;
  }
  
  p {
    font-size: 1.1rem;
    color: #7f8c8d;
    margin: 0;
  }
}

.model-selector {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  
  .model-btn {
    padding: 12px 24px;
    border: 2px solid #3498db;
    background: white;
    color: #3498db;
    border-radius: 25px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #3498db;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
    
    &.active {
      background: #3498db;
      color: white;
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
  }
}

.leaderboard-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 30px;
}

.loading, .error, .empty {
  padding: 60px 20px;
  text-align: center;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}

.leaderboard-table {
  .table-header {
    display: grid;
    grid-template-columns: 80px 2fr 1fr 1fr 1fr 1fr;
    gap: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 2px solid #e9ecef;
    font-weight: 700;
    color: #495057;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .table-row {
    display: grid;
    grid-template-columns: 80px 2fr 1fr 1fr 1fr 1fr;
    gap: 20px;
    padding: 20px;
    border-bottom: 1px solid #f1f3f4;
    align-items: center;
    transition: background-color 0.2s ease;
    
    &:hover {
      background: #f8f9fa;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .col-rank {
    text-align: center;
    
    .rank-badge {
      display: inline-block;
      width: 40px;
      height: 40px;
      line-height: 40px;
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.9rem;
      
      &.gold {
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #b8860b;
      }
      
      &.silver {
        background: linear-gradient(135deg, #c0c0c0, #e5e5e5);
        color: #696969;
      }
      
      &.bronze {
        background: linear-gradient(135deg, #cd7f32, #daa520);
        color: #8b4513;
      }
      
      &.normal {
        background: #e9ecef;
        color: #6c757d;
      }
    }
  }
  
  .col-username {
    font-weight: 600;
    color: #2c3e50;
  }
  
  .col-rating {
    font-weight: 700;
    color: #27ae60;
    font-size: 1.1rem;
  }
  
  .col-rd {
    color: #7f8c8d;
    font-size: 0.9rem;
  }
  
  .col-games {
    color: #34495e;
    font-weight: 500;
  }
  
  .col-winrate {
    font-weight: 600;
    color: #e67e22;
  }
}

.stats-info {
  display: flex;
  justify-content: center;
  gap: 40px;
  
  .stat-item {
    text-align: center;
    
    .stat-label {
      display: block;
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
    }
  }
}

@media (max-width: 768px) {
  .leaderboard-page {
    padding: 15px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .model-selector {
    flex-direction: column;
    align-items: center;
    
    .model-btn {
      width: 200px;
    }
  }
  
  .leaderboard-table {
    .table-header,
    .table-row {
      grid-template-columns: 60px 1.5fr 1fr 1fr;
      gap: 15px;
      padding: 15px;
      font-size: 0.8rem;
    }
    
    .col-rd,
    .col-games {
      display: none;
    }
  }
  
  .stats-info {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
