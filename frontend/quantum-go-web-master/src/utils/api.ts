import axios from "axios";
import Config from "@/config";
import CryptoJS from "crypto-js";
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

  public async createRoom(user_id: string, model: number = 9, countdown: number = 30): Promise<Response> {
    const data = { user_id, countdown, model };
    return this.request("/createRoom", data);
  }

  public async getGameInfo(roomId: string): Promise<Response> {
    const data = { room_id: roomId };
    return this.request("/getGameInfo", data);
  }

  public async getUserInfo(user_name: string, row_password: string): Promise<Response> {
    const user_password = CryptoJS.MD5(row_password).toString(CryptoJS.enc.Hex);
    const data = { username: user_name, password: user_password };
    return this.request("/getUserInfo", data);
  }

  public async userRegister(user_name: string, row_password: string): Promise<Response> {
    const user_password = CryptoJS.MD5(row_password).toString(CryptoJS.enc.Hex);
    console.log(user_password, row_password);
    const data = { username: user_name, password: user_password };
    return this.request("/userRegister", data);
  }
}

const api = new Api(Config.apiUrl);
export default api;