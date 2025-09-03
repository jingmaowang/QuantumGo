// 使用 Supabase 作为后端
const isProduction = window.location.hostname !== 'localhost';
const Config = {
  // 注意：现在大部分功能使用 Supabase，只有游戏相关功能需要后端 API
  apiUrl: isProduction 
    ? `${window.location.protocol}//${window.location.host}/api`
    : `http://localhost:3000`,
  wsUrl: isProduction 
    ? `wss://${window.location.host}/ws`
    : `ws://localhost:3000/ws`,
  // Supabase 配置
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
};

export default Config;
