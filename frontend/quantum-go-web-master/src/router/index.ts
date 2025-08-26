import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import IndexPage from "../views/IndexPage/index.vue";
import RoomPage from "../views/RoomPage/index.vue";
import LoginPage from "../views/LoginPage/index.vue";
import LeaderboardPage from "../views/LeaderboardPage/index.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Index",
    component: IndexPage
  },
  {
    path: "/room/:id",
    name: "Room",
    component: RoomPage
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage
  },
  {
    path: "/leaderboard",
    name: "Leaderboard",
    component: LeaderboardPage
  },
  // {
  //   path: "/join/:id",
  //   name: "Join",
  //   component: JoinPage
  // },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/"
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
