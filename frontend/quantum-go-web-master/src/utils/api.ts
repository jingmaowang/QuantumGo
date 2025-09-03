import axios from "axios";
import Config from "@/config";
import CryptoJS from "crypto-js";
import { testRegister as registerUser, testLogin as loginUser } from "./supabase-test";
import { Response } from "@/utils/types";

class Api {

  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(path: string, data: Record<string, any>) {
    try {
      const response = await axios.post(`${this.baseUrl}${path}`, data);
      if (response.status < 200 || response.status >= 300) {
        return { success: false, status: response.status, data: response.data };
      }
      return { success: true, status: response.status, data: response.data };
    } catch (error: any) {
      return { success: false, status: error.status, data: {} };
    }
  }

  public async createRoom(user_id: string, model: number = 9, countdown: number = 30, gameMode: string = "pvp"): Promise<Response> {
    const data = { user_id, countdown, model, gameMode };
    return this.request("/createRoom", data);
  }

  public async getGameInfo(roomId: string): Promise<Response> {
    const data = { room_id: roomId };
    return this.request("/getGameInfo", data);
  }

  public async getUserInfo(user_name: string, row_password: string): Promise<Response> {
    // 使用 Supabase 登录
    const result = await loginUser(user_name, row_password);
    return result;
  }

  public async userRegister(user_name: string, row_password: string): Promise<Response> {
    // 使用 Supabase 注册
    const result = await registerUser(user_name, row_password);
    return result;
  }

  public async getLeaderboard(model: number, limit: number = 50): Promise<Response> {
    // 临时返回空数据
    return { success: true, data: [] };
  }

  public async aiMove(roomId: string, userId: string, gameMode: string = "ai", boardState?: any): Promise<Response> {
    const data = { 
      room_id: roomId, 
      user_id: userId, 
      game_mode: gameMode,
      board_state: boardState // 传递当前棋盘状态
    };
    return this.request("/aiMove", data);
  }

  // 更新玩家移动状态接口
  public async updatePlayerMove(roomId: string, userId: string, position: string, gameMode: string, board?: any): Promise<Response> {
    const data = { room_id: roomId, user_id: userId, position: position, game_mode: gameMode, board: board };
    return this.request("/updatePlayerMove", data);
  }
}

const api = new Api(Config.apiUrl);
export default api;