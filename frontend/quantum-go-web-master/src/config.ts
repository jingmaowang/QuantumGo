// 根据环境自动配置 API 端点
const isProduction = window.location.hostname !== 'localhost';
const Config = {
  apiUrl: isProduction 
    ? `${window.location.protocol}//${window.location.host}/api`
    : `http://localhost:3000`,
  wsUrl: isProduction 
    ? `wss://${window.location.host}/ws`
    : `ws://localhost:3000/ws`
};

export default Config;
