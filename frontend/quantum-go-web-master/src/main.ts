import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// import '@/assets/style/theme.css';
import "element-plus/dist/index.css";

const app = createApp(App).use(store).use(router);

(async () => {
    await store.dispatch("user/initializeUserInfo");
    app.mount("#app");
})();
