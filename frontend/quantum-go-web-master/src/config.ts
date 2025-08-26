// const Config = {
//   apiUrl: `${window.location.protocol}//${window.location.host}/api`,
//   wsUrl: `ws://${window.location.host}/ws`
// };

// 使用 localhost 进行本地开发
const host = "localhost";
const Config = {
  apiUrl: `http://${host}:3000`,
  wsUrl: `ws://${host}:3000/ws`
};

export default Config;
