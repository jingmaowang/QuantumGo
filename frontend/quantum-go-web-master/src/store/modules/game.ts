import { Board, BoardModel, Chessman, ChessmanRecord, ChessmanRecords, ChessmanType } from "@/utils/types";
import { canPutChess, getCapturedChess } from "@/utils/chess";
import { calculateGoResult } from "@/utils/chess2";
import api from "@/utils/api";

const state = () => ({
  roomId: "" as string,
  status: "waiting" as "waiting" | "playing" | "finished",
  subStatus: "black" as "black" | "white" | "common",
  countdown: 30 as number,
  moves: 0 as number,
  blackQuantum: "" as string,
  whiteQuantum: "" as string,
  blackLost: 0 as number,
  whiteLost: 0 as number,
  blackPoints: 0 as number,
  whitePoints: 0 as number,
  round: true as boolean,
  camp: "black" as ChessmanType,
  model: 9 as BoardModel,
  gameMode: "pvp" as string,
  board1: new Map() as Board,
  board2: new Map() as Board,
  records: [] as ChessmanRecords
});

const mutations = {
  setRoomId(state: any, id: string) {
    state.id = id;
  },

  setStatus(state: any, status: "waiting" | "playing" | "finished") {
    state.status = status;
  },

  setRound(state: any, round: boolean) {
    state.round = round;
  },

  setGameMode(state: any, gameMode: string) {
    state.gameMode = gameMode;
  },

  setChess(state: any, chessman1: Chessman) {
    state.board1.set(chessman1.position, chessman1);
    const chessman2: Chessman = {
      position: chessman1.brother,
      type: chessman1.type,
      brother: chessman1.position
    };
    state.board2.set(chessman2.position, chessman2);
  },

  deleteChess(state: any, position: string) {
    const chessInfo = state.board1.get(position);
    if (chessInfo.type === "black") {
      state.blackLost++;
    } else {
      state.whiteLost++;
    }
    state.board1.delete(position);
    state.board2.delete(chessInfo.brother);
  },

  initBoard(state: any) {
    state.board1.clear();
    state.board2.clear();
    state.status = "waiting";
    state.subStatus = "black";
    state.blackQuantum = "";
    state.whiteQuantum = "";
    state.round = true;
  }
};

const actions = {
  async setGameInfo({ commit, rootState, state }: any, data: Record<string, any>) {
    const { room_id, status, owner_id, round, board, moves, white_lost, black_lost, countdown, model, chessman_records } = data;
    const boardMap = new Map(JSON.stringify(board) === "{}" ? [] : board);
    state.board1.clear();
    state.board2.clear();
    state.roomId = room_id;
    state.status = status;
    state.moves = moves;
    state.whiteLost = white_lost;
    state.blackLost = black_lost;
    state.countdown = countdown;
    state.model = model;
    state.records = chessman_records ?? [];
    if (status === "waiting" && data.visitor_id) {
      state.status = "playing";
    }
    const isOwner = owner_id === rootState.user.id;
    state.camp = isOwner ? "black" : "white";
    state.round = isOwner ? round === "black" : round === "white";
    const count = boardMap.size;
    if (count === 0) {
      state.blackQuantum = "";
      state.whiteQuantum = "";
      state.subStatus = "black";
    } else {
      boardMap.forEach((chessman: any) => {
        if (chessman.position !== chessman.brother) {
          if (chessman.type === "black") {
            state.blackQuantum = chessman.position ?? "0,0";
          } else {
            state.whiteQuantum = chessman.position ?? "0,0";
          }
        }
        commit("setChess", chessman);
      });
      state.subStatus = count === 1 ? "white" : "common";
    }
  },

  async setGameStatus({ commit }: any, status: string) {
    commit("setStatus", status);
  },

  async getGameInfo({ commit, rootState }: any) {
    const res = await api.getGameInfo(rootState.user.id);
    if (!res.success) {
      return false;
    }
    const data = res.data;
    commit("setRoomId", data.roow_id);
  },

  async initBoard({ commit }: any) {
    commit("initBoard");
  },

  async createRoom({ commit, rootState }: any, data: { gameMode: string, countdown: number, model: number }): Promise<false | string> {
    const res = await api.createRoom(rootState.user.id, data.model, data.countdown, data.gameMode);
    if (!res.success) {
      return false;
    }
    commit("setGameMode", data.gameMode);
    return res.data.room_id;
  },

  async backChess({ state }: any) {
    if (state.records.length < 2) {
      return false;
    }
    const records = state.records.splice(-2).reverse();
    records.forEach((record: ChessmanRecord) => {
      state.board1.delete(record.add[0].position);
      state.board2.delete(record.add[0].brother);
      record.reduce.forEach((chessman: Chessman) => {
        state.board1.set(chessman.position, chessman);
        state.board2.set(chessman.brother, chessman);
      });
    });
  },

  async putChess({ commit, state }: any, payload: { position: string, type: ChessmanType }): Promise<boolean> {
    if (state.status !== "playing") {
      return false;
    }
    const chessman: Chessman = { position: payload.position, type: payload.type, brother: payload.position };
    if (!canPutChess(state.board1, payload.position, chessman.type, state.model) || !canPutChess(state.board2, payload.position, chessman.type, state.model)) {
      return false;
    }
    const record = { add: [], reduce: [] } as ChessmanRecord;
    record.add.push(chessman);
    commit("setChess", chessman);
    if (state.subStatus === "black") {
      state.blackQuantum = chessman.position;
      state.subStatus = "white";
    } else if (state.subStatus === "white") {
      state.whiteQuantum = chessman.position;
      state.subStatus = "common";
      const blackChess1 = state.board1.get(state.blackQuantum);
      const whiteChess1 = state.board1.get(state.whiteQuantum);
      const blackChess2 = state.board2.get(state.blackQuantum);
      const whiteChess2 = state.board2.get(state.whiteQuantum);
      blackChess1.brother = whiteChess1.position;
      whiteChess1.brother = blackChess1.position;
      blackChess2.brother = whiteChess2.position;
      whiteChess2.brother = blackChess2.position;
      blackChess2.type = "white";
      whiteChess2.type = "black";
    }
    commit("setRound", !state.round);
    const capturedChess1 = getCapturedChess(state.board1, chessman.type, state.model);
    const capturedChess2_row = getCapturedChess(state.board2, chessman.type, state.model);
    console.log(capturedChess1, capturedChess2_row);
    const capturedChess2 = new Set([...capturedChess2_row].map(position => state.board2.get(position).brother));
    const capturedChess = new Set([...capturedChess1, ...capturedChess2]);
    console.log(capturedChess);
    capturedChess.forEach(chessPosition => {
      record.reduce.push(state.board1.get(chessPosition));
      commit("deleteChess", chessPosition);
    });
    state.records.push(record);
    const result1 = calculateGoResult(state.board1, state.model, state.blackLost, state.whiteLost);
    const result2 = calculateGoResult(state.board2, state.model, state.blackLost, state.whiteLost);
    console.log(result1, result2);
    state.blackPoints = Math.floor((result1.blackScore + result2.blackScore) / 2);
    state.whitePoints = Math.floor((result1.whiteScore + result2.whiteScore) / 2);
    return true;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
