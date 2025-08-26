<template>
  <!-- 主要状态提示 -->
  <div class="status-container">
    <!-- 常规状态提示 -->
    <div class="status-message" :class="[statusType, { pulse: isPulsing }]">
      <span class="text">{{ statusText }}</span>
      <span v-if="countdown" class="countdown">{{ countdown }}s</span>
    </div>

    <!-- 胜负弹窗 -->
    <div v-if="showResult" class="result-modal">
      <div class="result-content">
        <div class="result-icon">🎉</div>
        <h3 class="result-title">{{ resultText }}</h3>
        <p class="result-detail">对局已结束 · 共{{ totalMoves }}手</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$bg-color: #FEF6EC;
$primary-color: #EB894F;
$secondary-color: #D97A42;
$text-color: #6E4C41;

.status-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
}

// 基础状态消息样式
.status-message {
  padding: 12px 24px;
  border-radius: 30px;
  background: rgba($bg-color, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  .text {
    color: $text-color;
    font-size: 15px;
    letter-spacing: 0.5px;
  }

  .countdown {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 500;
    animation: pulseScale 1s infinite;
  }
}

// 状态类型修饰符
.status-message {
  &.normal {
    .countdown {
      background: rgba($primary-color, 0.15);
      color: $primary-color;
    }
  }

  &.warning {
    .countdown {
      background: rgba(#E9A23B, 0.15);
      color: #E9A23B;
    }
  }

  &.alert {
    .countdown {
      background: rgba(#EB894F, 0.2);
      color: #D97A42;
      animation: alertPulse 0.8s infinite;
    }
  }
}

// 胜负弹窗
.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  animation: fadeIn 0.3s ease;

  .result-content {
    background: rgba($bg-color, 0.98);
    padding: 40px;
    border-radius: 30px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transform: translateY(20px);
    animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .result-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .result-title {
    color: $primary-color;
    font-size: 28px;
    margin-bottom: 8px;
  }

  .result-detail {
    color: rgba($text-color, 0.8);
    font-size: 14px;
  }
}

// 动画定义
@keyframes pulseScale {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes alertPulse {
  0% { box-shadow: 0 0 0 0 rgba($primary-color, 0.2); }
  70% { box-shadow: 0 0 0 12px rgba($primary-color, 0); }
  100% { box-shadow: 0 0 0 0 rgba($primary-color, 0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 移动端适配
@media (max-width: 768px) {
  .status-message {
    padding: 10px 20px;
    font-size: 14px;

    .countdown {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }
  }

  .result-modal {
    .result-content {
      padding: 24px;
      width: 80%;
    }

    .result-icon {
      font-size: 48px;
    }

    .result-title {
      font-size: 22px;
    }
  }
}
</style>