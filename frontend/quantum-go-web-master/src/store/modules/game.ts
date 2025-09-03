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
    state.roomId = id;
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
    state.subStatus = "black";
    state.blackQuantum = "";
    state.whiteQuantum = "";
    state.round = true;
  }
};

const actions = {
  async setGameInfo({ commit, rootState, state }: any, data: Record<string, any>) {
    const { room_id, status, owner_id, round, board, moves, white_lost, black_lost, countdown, model, chessman_records, visitor_id } = data;
    
    // 处理 board 数据 - 从 Supabase 返回的 JSON 对象转换为 Map
    let boardMap = new Map();
    if (board && typeof board === 'object') {
      // 如果 board 是对象，尝试转换为 Map
      if (board.board1 && typeof board.board1 === 'object') {
        boardMap = new Map(Object.entries(board.board1));
      } else if (Array.isArray(board)) {
        boardMap = new Map(board);
      } else {
        // 如果 board 是空对象或其他格式，创建空 Map
        boardMap = new Map();
      }
    }
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
    
    // 判断是否是AI对战房间：visitor_id为特殊UUID且status为playing
    const isAIGame = visitor_id === "00000000-0000-0000-0000-000000000000" && status === "playing";
    console.log("setGameInfo: Is AI game:", isAIGame, "visitor_id:", visitor_id, "status:", status);
    
    // 如果从URL参数判断是AI模式，强制设置为AI模式
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const gameModeFromUrl = urlParams.get('gameMode');
      if (gameModeFromUrl === 'ai') {
        console.log("AI mode detected from URL parameter in store");
        state.gameMode = "ai";
        state.status = "playing";
        state.camp = "black";
        state.round = true;
        console.log("AI game mode forced from URL parameter");
        return;
      }
    }
    
    if (isAIGame) {
      // 这是AI对战房间，确保状态为playing
      state.status = "playing";
      // 设置游戏模式为AI
      state.gameMode = "ai";
      console.log("AI game mode detected and set in store");
    } else if (status === "waiting") {
      // 普通PVP房间，当有人加入时自动开始游戏
      state.status = "playing";
      state.gameMode = "pvp";
      console.log("PvP mode: auto-starting game from waiting status");
      
      // 更新数据库中的房间状态和访客ID
      try {
        const { updateRoomInfo } = await import("../../utils/supabase-room");
        const isOwner = owner_id === rootState.user.id;
        if (!isOwner && !visitor_id) {
          // 第二个玩家加入，设置 visitor_id
          await updateRoomInfo(room_id, { 
            status: "playing", 
            visitor_id: rootState.user.id 
          });
          console.log("PvP mode: second player joined, visitor_id set to:", rootState.user.id);
        } else {
          // 房主加入，只更新状态
          await updateRoomInfo(room_id, { status: "playing" });
          console.log("PvP mode: room status updated to playing in database");
        }
      } catch (error) {
        console.error("PvP mode: failed to update room status:", error);
      }
    } else {
      // 默认PVP模式
      state.gameMode = "pvp";
    }
    
    const isOwner = owner_id === rootState.user.id;
    
    // AI模式下，玩家总是黑方，AI是白方
    if (isAIGame) {
      state.camp = "black";
      state.round = true; // 黑方先手
      console.log("AI mode: player is black, round set to true");
    } else {
      state.camp = isOwner ? "black" : "white";
      
      // 在 PvP 模式下，如果游戏刚开始（moves === 0），让房主先下棋
      if (moves === 0) {
        state.round = isOwner; // 房主先下棋
        console.log("PvP mode: game starting, owner goes first, isOwner=", isOwner, "state.round=", state.round);
      } else {
        // 游戏进行中，根据数据库中的 round 值设置
        state.round = isOwner ? round === "black" : round === "white";
        console.log("PvP mode: game in progress, isOwner=", isOwner, "round=", round, "camp=", state.camp, "state.round=", state.round);
      }
    }
    const count = boardMap.size;
    if (count === 0) {
      state.blackQuantum = "";
      state.whiteQuantum = "";
      state.subStatus = "black";
      // AI模式下，确保初始状态正确
      if (isAIGame) {
        console.log("AI mode: initializing empty board");
      }
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
    commit("setRoomId", data.room_id);
  },

  async initBoard({ commit }: any) {
    commit("initBoard");
  },

  async createRoom({ commit, rootState, state }: any, data: { gameMode: string, countdown: number, model: number }): Promise<false | string> {
    const res = await api.createRoom(rootState.user.id, data.model, data.countdown, data.gameMode);
    if (!res.success) {
      return false;
    }
    commit("setGameMode", data.gameMode);
    
    // 如果是AI对战模式，立即设置游戏状态为playing
    if (data.gameMode === "ai") {
      commit("setStatus", "playing");
      // 设置房间ID
      commit("setRoomId", res.data.room_id);
      // 初始化棋盘
      commit("initBoard");
      // 设置棋盘大小
      state.model = data.model;
      state.countdown = data.countdown;
      // 设置玩家为黑方（AI为白方）
      state.camp = "black";
      state.round = true; // 黑方先手
      
      // 在sessionStorage中保存AI模式信息，供RoomPage使用
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`room_${res.data.room_id}_mode`, 'ai');
        console.log("AI mode saved to session storage for room:", res.data.room_id);
      }
    }
    
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

  async putChess({ commit, state, rootState }: any, payload: { position: string, type: ChessmanType }): Promise<boolean> {
    // 在 PvP 模式下，如果状态是 waiting，不允许下棋
    if (state.status === "waiting" && state.gameMode === "pvp") {
      console.log("PvP mode: cannot place chess, waiting for second player to join");
      return false;
    } else if (state.status !== "playing") {
      return false;
    }
    const chessman: Chessman = { position: payload.position, type: payload.type, brother: payload.position };
    if (!canPutChess(state.board1, payload.position, chessman.type, state.model) || !canPutChess(state.board2, payload.position, chessman.type, state.model)) {
      return false;
    }
    
    // 增加移动计数
    state.moves++;
    
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
    // 在量子围棋中，每个玩家需要下两个棋子（黑子和白子）才能完成一轮
    // 只有当 subStatus 变为 "common" 时，才切换回合
    console.log("PvP mode: after move, subStatus=", state.subStatus, "current round=", state.round);
    if (state.gameMode !== "ai" && state.subStatus === "common") {
      commit("setRound", !state.round);
      console.log("PvP mode: round switched, new round=", !state.round);
    }
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

    // 如果是AI对战模式，在玩家落子后让AI下棋
    if (state.gameMode === "ai" && state.status === "playing") {
      console.log("AI mode: player moved, triggering AI response");
      console.log("Current moves count:", state.moves);
      console.log("Current round:", state.round);
      console.log("Current subStatus:", state.subStatus);
      
      // 首先更新玩家的移动状态到后端
      try {
        console.log("Updating player move state to backend...");
        
        // 准备棋盘状态数据
        const boardData = {
          board1: Object.fromEntries(state.board1),
          board2: Object.fromEntries(state.board2),
          moves: state.moves,
          round: state.round,
          subStatus: state.subStatus
        };
        
        const updateResponse = await api.updatePlayerMove(
          state.roomId, 
          rootState.user.id, 
          payload.position, 
          state.gameMode,
          boardData // 传递棋盘状态
        );
        
        if (updateResponse.success) {
          console.log("Player move state updated successfully:", updateResponse.data);
          // 同步后端的moves计数
          state.moves = updateResponse.data.moves;
        } else {
          console.error("Failed to update player move state:", updateResponse);
        }
      } catch (error) {
        console.error("Error updating player move state:", error);
      }
      
      // 延迟一下让AI下棋，模拟思考时间
      setTimeout(async () => {
        try {
          console.log("Calling AI move API for room:", state.roomId, "user:", rootState.user.id);
          
          // 准备当前棋盘状态数据
          const boardState = {
            board1: Object.fromEntries(state.board1),
            board2: Object.fromEntries(state.board2),
            moves: state.moves,
            round: state.round,
            subStatus: state.subStatus,
            blackQuantum: state.blackQuantum,
            whiteQuantum: state.whiteQuantum
          };
          
          const aiResponse = await api.aiMove(state.roomId, rootState.user.id, state.gameMode, boardState);
          console.log("AI response received:", aiResponse);
          
          if (aiResponse.success && aiResponse.data.ai_move) {
            const aiMove = aiResponse.data.ai_move;
            console.log("AI move data:", aiMove);
            
            // 检查AI是否真的在下棋，还是处于等待状态
            const isRealMove = aiMove.type === "white" || aiMove.type === "black";
            const isValidPosition = /^\d+,\d+$/.test(aiMove.position);
            
            if (isRealMove && isValidPosition) {
              // 检查AI要下的位置是否已被占用
              if (state.board1.has(aiMove.position) || state.board2.has(aiMove.position)) {
                console.warn("AI tried to place stone at occupied position:", aiMove.position);
                console.log("Board1 has stone:", state.board1.has(aiMove.position));
                console.log("Board2 has stone:", state.board2.has(aiMove.position));
                console.log("Skipping AI move to prevent overwriting player's stones");
                return;
              }
              
              // AI真的在下棋，创建棋子并添加到棋盘
              // 修复：AI落子时，两个棋盘应该完全同步，brother设置为相同位置
              const aiChessman1: Chessman = { 
                position: aiMove.position, 
                type: aiMove.type as ChessmanType, 
                brother: aiMove.position 
              };
              
              const aiChessman2: Chessman = { 
                position: aiMove.position, 
                type: aiMove.type as ChessmanType, 
                brother: aiMove.position 
              };
              
              console.log("Creating AI chessman for both boards:", aiChessman1);
              
              // 直接操作两个棋盘，确保完全同步
              state.board1.set(aiMove.position, aiChessman1);
              state.board2.set(aiMove.position, aiChessman2);
              
              // 添加调试日志，验证两个棋盘同步
              console.log("AI move applied to both boards:");
              console.log("Board1 size:", state.board1.size, "Board2 size:", state.board2.size);
              console.log("Board1 keys:", Array.from(state.board1.keys()));
              console.log("Board2 keys:", Array.from(state.board2.keys()));
              console.log("Position", aiMove.position, "in Board1:", state.board1.get(aiMove.position));
              console.log("Position", aiMove.position, "in Board2:", state.board2.get(aiMove.position));
              
              // 更新量子状态
              if (state.subStatus === "black") {
                state.blackQuantum = aiMove.position;
                state.subStatus = "white";
              } else if (state.subStatus === "white") {
                state.whiteQuantum = aiMove.position;
                state.subStatus = "common";
                
                // 处理量子纠缠 - 确保两个棋盘完全同步
                const blackChess1 = state.board1.get(state.blackQuantum);
                const whiteChess1 = state.board1.get(state.whiteQuantum);
                const blackChess2 = state.board2.get(state.blackQuantum);
                const whiteChess2 = state.board2.get(state.whiteQuantum);
                
                if (blackChess1 && whiteChess1 && blackChess2 && whiteChess2) {
                  // 更新brother关系
                  blackChess1.brother = whiteChess1.position;
                  whiteChess1.brother = blackChess1.position;
                  blackChess2.brother = whiteChess2.position;
                  whiteChess2.brother = blackChess2.position;
                  
                  // 交换类型，确保两个棋盘完全一致
                  blackChess2.type = "white";
                  whiteChess2.type = "black";
                  
                  console.log("Quantum entanglement applied, boards synchronized");
                  console.log("Board1 state:", Object.fromEntries(state.board1));
                  console.log("Board2 state:", Object.fromEntries(state.board2));
                  
                  // 验证两个棋盘的同步状态
                  const board1Keys = Array.from(state.board1.keys()).sort();
                  const board2Keys = Array.from(state.board2.keys()).sort();
                  const keysMatch = JSON.stringify(board1Keys) === JSON.stringify(board2Keys);
                  console.log("Board keys match:", keysMatch);
                  console.log("Board1 keys:", board1Keys);
                  console.log("Board2 keys:", board2Keys);
                  
                  // 验证每个位置的棋子状态
                  for (const key of board1Keys) {
                    const chess1 = state.board1.get(key);
                    const chess2 = state.board2.get(key);
                    if (chess1 && chess2) {
                      const positionsMatch = chess1.position === chess2.position;
                      const typesMatch = chess1.type === chess2.type;
                      const brothersMatch = chess1.brother === chess2.brother;
                      console.log(`Position ${key}: positions=${positionsMatch}, types=${typesMatch}, brothers=${brothersMatch}`);
                    }
                  }
                  
                  // 重要：量子纠缠完成后，重置subStatus为black，让AI可以继续下棋
                  state.subStatus = "black";
                  console.log("Quantum entanglement completed, subStatus reset to black for next AI move");
                }
              }
              
              // 在量子围棋中，AI下棋后，玩家应该能够继续下棋
              console.log("AI placed at:", aiMove.position, "player can continue playing");
              
              // 计算得分
              const result1 = calculateGoResult(state.board1, state.model, state.blackLost, state.whiteLost);
              const result2 = calculateGoResult(state.board2, state.model, state.blackLost, state.whiteLost);
              state.blackPoints = Math.floor((result1.blackScore + result2.blackScore) / 2);
              state.whitePoints = Math.floor((result1.whiteScore + result2.whiteScore) / 2);
              
            } else {
              // AI处于等待状态或不需要下棋，只记录日志
              console.log("AI not moving this turn:", aiMove.type, aiMove.position);
              if (aiMove.type === "waiting") {
                console.log("AI is waiting for player's move");
              } else if (aiMove.type === "none") {
                console.log("AI is in entanglement phase, no move needed");
              }
              // 不切换回合，不添加棋子，让玩家继续下棋
            }
          } else {
            console.error("AI move failed or invalid response:", aiResponse);
            // AI移动失败时，仍然切换回合给玩家
            commit("setRound", true);
          }
        } catch (error) {
          console.error("AI move failed:", error);
          // AI移动失败时，仍然切换回合给玩家
          commit("setRound", true);
        }
      }, 1000); // 1秒后AI下棋
    }

    // 在 PvP 模式下，更新数据库中的游戏状态
    if (state.gameMode === "pvp" && state.status === "playing") {
      try {
        const { updateRoomInfo } = await import("../../utils/supabase-room");
        const boardData = {
          board1: Object.fromEntries(state.board1),
          board2: Object.fromEntries(state.board2)
        };
        await updateRoomInfo(state.roomId, {
          board: boardData,
          moves: state.moves,
          round: state.round ? "black" : "white",
          black_lost: state.blackLost,
          white_lost: state.whiteLost,
          chessman_records: state.records
        });
        console.log("PvP mode: game state updated in database");
      } catch (error) {
        console.error("PvP mode: failed to update game state:", error);
      }
    }

    return true;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
