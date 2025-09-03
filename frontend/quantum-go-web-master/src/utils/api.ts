import axios from "axios";
import Config from "@/config";
import CryptoJS from "crypto-js";
import { testRegister as registerUser, testLogin as loginUser } from "./supabase-test";
import { createRoom as supabaseCreateRoom, getGameInfo as supabaseGetGameInfo, updatePlayerMove as supabaseUpdatePlayerMove, aiMove as supabaseAiMove } from "./supabase-room";
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
    // 使用 Supabase 创建房间
    const result = await supabaseCreateRoom(user_id, model, countdown, gameMode);
    return result;
  }

  public async getGameInfo(roomId: string): Promise<Response> {
    // 使用 Supabase 获取游戏信息
    const result = await supabaseGetGameInfo(roomId);
    return result;
  }

  public async getUserInfo(user_name: string, row_password: string): Promise<Response> {
    // 使用 Supabase 登录
    const result = await loginUser(user_name, row_password);
    return { success: result.success, status: result.success ? 200 : 401, data: result.data || { error: result.error } };ai对战
  }

  public async userRegister(user_name: string, row_password: string): Promise<Response> {
    // 使用 Supabase 注册
    const result = await registerUser(user_name, row_password);
    return { success: result.success, status: result.success ? 200 : 400, data: result.data || { error: result.error } };
  }

  public async getLeaderboard(model: number, limit: number = 50): Promise<Response> {
    // 临时返回空数据
    return { success: true, status: 200, data: [] };
  }

  public async aiMove(roomId: string, userId: string, gameMode: string = "ai", boardState?: any): Promise<Response> {
    // 使用 Supabase AI 移动
    const result = await supabaseAiMove(roomId, userId, gameMode, boardState);
    return result;
  }

  // 更新玩家移动状态接口
  public async updatePlayerMove(roomId: string, userId: string, position: string, gameMode: string, board?: any): Promise<Response> {
    // 使用 Supabase 更新玩家移动
    const result = await supabaseUpdatePlayerMove(roomId, userId, position, gameMode, board);
    return result;
  }
}

const api = new Api(Config.apiUrl);
export default api;