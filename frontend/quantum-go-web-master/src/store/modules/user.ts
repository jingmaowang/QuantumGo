import { v4 as uuidv4 } from "uuid";
import api from "@/utils/api";
import { Response } from "@/utils/types";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";

const state = () => ({
  id: "" as string,
  isLogin: false as boolean,
  name: "" as string
});

const mutations = {
  setUserId(state: any, id: string) {
    state.id = id;
  },

  setLoginState(state: any, isLogin: boolean) {
    state.isLogin = isLogin;
  },

  setName(state: any, name: string) {
    state.name = name;
  },

  clearUserInfo(state: any) {
    state.id = "";
    state.isLogin = false;
    state.name = "";
  }
};

const actions = {
  async initializeUserInfo({ commit, rootState }: any) {
    let storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem("userId", storedUserId);
    }
    commit("setUserId", storedUserId);
    const user_name = localStorage.getItem("user_name") ?? "";
    const password = localStorage.getItem("user_password") ?? "";
    if (user_name && password) {
      const res = await api.getUserInfo(user_name, password);
      if (res.success) {
        commit("setLoginState", true);
        commit("setName", user_name);
        // ElMessage.success({ message: rootState.lang.text.login.login_success + user_name, grouping: true });
      }
    }
  },

  async login({ commit, state }: any, { user_name, password }: { user_name: string, password: string }): Promise<Response> {
    const res = await api.getUserInfo(user_name, password);
    if (res.success) {
      commit("setLoginState", true);
      commit("setName", user_name);
      localStorage.setItem("userId", state.id);
      localStorage.setItem("user_name", user_name);
      localStorage.setItem("user_password", password);
    }
    return res;
  },

  async register({ commit }: any, { user_name, password }: { user_name: string, password: string }): Promise<Response> {
    const res = await api.userRegister(user_name, password);
    if (res.success) {
      commit("setLoginState", true);
      commit("setName", user_name);
      localStorage.setItem("userId", state().id);
      localStorage.setItem("user_name", user_name);
      localStorage.setItem("user_password", password);
    }
    return res;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
