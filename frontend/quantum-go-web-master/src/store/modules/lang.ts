const state = () => ({
  active: "en" as "en" | "cn",
  text: text.en as Object
});

const mutations = {
  setLanguage(state: any, language: "en" | "cn") {
    state.active = language;
    state.text = text[language];
  },

  changeLanguage(state: any) {
    let lang = "en";
    if (state.active === "en") {
      lang = "cn";
    }
    state.active = lang;
    state.text = text[lang as "en" | "cn"];
  }
};

const actions = {};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};

const text = {
  en: {
    navbar: {
      logo: "QuantumGo",
      lang: "Language",
      leaderboard: "Leaderboard",
      share: "Share",
      share_website: "Click on the link to experience online quantum Go battles: ",
      share_battle: "Click on the link to play quantum Go with me now: ",
      copy_success: "Already copied to clipboard.",
      login: "Login"
    },
    board: {
      put_chess_error: "No playing chess here",
      ws_connection_error: "Game connection error"
    },
    index: {
      title: "Play Go Online",
      desc: "Experience the fusion of ancient strategy and modern intelligence. Play against Al, learn the beauty of Go, and train your mind with every move.",
      create: "Create Room",
      join: "Join Room",
      btn_start: "Start Game",
      create_room_error: "Failed to create room",
      create_room_error_empty_options: "Please select game mode, chessboard model and countdown",
      create_room_title: "Create Room",
      game_mode_title: "Game Mode",
      game_mode_placeholder: "Please select game mode",
      game_mode_pvp: "Player vs Player",
      game_mode_ai: "Player vs AI",
      model_title: "Model",
      model_placeholder: "Please select chessboard model",
      model_9: "9x9 chessboard",
      model_13: "13x13 chessboard",
      model_19: "19x19 chessboard",
      countdown_title: "Countdown",
      countdown_placeholder: "Please select a turn time limit",
      cancel: "Cancel",
      confirm: "Confirm"
    },
    room: {
      pass: "Pass",
      draw: "Draw",
      takeback: "Takeback",
      resign: "Resign",
      chat_placeholder: "Type here to chat, press Enter to send.",
      ws_disconnected: "Game server disconnected.",
      not_round: "It's not your turn now.",
      pass_early: "Pass is not allowed in the first two moves.",
      winner: "The game is over, and you have won!",
      loser: "The game is over, and the opponent has the upper hand.",
      moves: "Moves",
      points: "Capture",
      score: "Score",
      start_game: "Start Game!",
      time_up: "Operation timeout, pass this round",
      back_apply_waiting: "The application has been submitted and is awaiting the other party's action.",
      back_apply_early: "The first two moves are not allowed to take back.",
      back_apply_title: "Takeback Request",
      back_apply_content: "The opponent has requested a takeback. Do you agree?",
      back_apply_btn_agree: "Agree",
      back_apply_btn_reject: "Reject",
      back_apply_success: "The other party has agreed to your application.",
      back_apply_fail: "The other party has rejected your application.",
    },
    join: {
      net_error: "Network error, please check your network connection.",
      room_not_found: "Room not found, please check the room ID.",
      room_playing: "The game is currently underway.",
      room_finished: "The game has already finished.",
      join_self: "You cannot join your own room."
    },
    leaderboard: {
      title: "Player Leaderboard",
      subtitle: "View your ranking among Quantum Go players",
      rank: "Rank",
      username: "Username",
      rating: "Rating",
      rd: "RD",
      games: "Games",
      win_rate: "Win Rate",
      total_players: "Total Players",
      avg_rating: "Average Rating",
      no_data: "No players found for this board size"
    },
    login: {
      title_login: "Login",
      title_register: "Register",
      label_name: "Username",
      label_password: "Password",
      label_password_confirm: "Confirm Password",
      placeholder_name: "Please enter your username",
      placeholder_password: "Please enter your password",
      placeholder_password_confirm: "Please confirm your password",
      btn_login: "Login now",
      btn_register: "Register now",
      password_not_confirm: "The two passwords do not match",
      login_error: "Login failed, please check your username and password",
      login_success: "Welcome: ",
      register_error: "Registration failed, please check your username"
    }
  },
  cn: {
    navbar: {
      logo: "量子围棋",
      lang: "语言",
      leaderboard: "排行榜",
      share: "分享",
      share_content: "点击链接体验在线量子围棋对战:  ",
      share_battle: "点击链接即刻与我对弈量子围棋对弈: ",
      copy_success: "已复制到剪贴板",
      login: "登录"
    },
    board: {
      put_chess_error: "No playing chess here",
      ws_connection_error: "游戏服务器连接错误"
    },
    index: {
      title: "在线量子围棋对弈",
      desc: "智弈古今 慧启心源——与AI手谈，品围棋至道，悟方寸玄机。",
      create: "创建房间",
      join: "加入房间",
      btn_start: "开始游戏",
      create_room_error: "创建房间失败",
      create_room_error_empty_options: "请选择游戏模式、棋盘类型和回合时限",
      create_room_title: "创建房间",
      game_mode_title: "游戏模式",
      game_mode_placeholder: "请选择游戏模式",
      game_mode_pvp: "玩家对战",
      game_mode_ai: "AI对战",
      model_title: "棋盘",
      model_placeholder: "请选择棋盘类型",
      model_9: "9x9棋盘",
      model_13: "13x13棋盘",
      model_19: "19x19棋盘",
      countdown_title: "回合时限",
      countdown_placeholder: "请选择回合时限",
      cancel: "取消",
      confirm: "确定"
    },
    room: {
      pass: "虚着",
      draw: "求和",
      resign: "认输",
      takeback: "悔棋",
      chat_placeholder: "输入文字，回车以发送消息",
      ws_disconnected: "游戏服务器断开连接",
      not_round: "当前不是你的回合",
      pass_early: "前两手禁止虚着",
      winner: "游戏结束，你获得了胜利",
      loser: "游戏结束，对方更胜一筹",
      moves: "步数",
      points: "提子",
      score: "得分",
      start_game: "开始游戏！",
      time_up: "操作超时，跳过本轮",
      back_apply_waiting: "申请已提交，等待对方操作",
      back_apply_early: "前两手禁止悔棋",
      back_apply_title: "悔棋申请",
      back_apply_content: "对方申请悔棋，是否同意？",
      back_apply_btn_agree: "同意",
      back_apply_btn_reject: "拒绝",
      back_apply_success: "对方同意了你的申请",
      back_apply_fail: "对方拒绝了你的申请",
    },
    join: {
      net_error: "网络错误，请检查网络连接",
      room_not_found: "房间不存在，请检查房间ID",
      room_playing: "对局正在进行中",
      room_finished: "对局已经结束",
      join_self: "你不能加入自己的房间"
    },
    leaderboard: {
      title: "玩家排行榜",
      subtitle: "查看您在量子围棋玩家中的排名",
      rank: "排名",
      username: "用户名",
      rating: "评分",
      rd: "RD",
      games: "对局",
      win_rate: "胜率",
      total_players: "总玩家数",
      avg_rating: "平均评分",
      no_data: "未找到该棋盘尺寸的玩家"
    },
    login: {
      title_login: "登录",
      title_register: "注册",
      label_name: "用户名",
      label_password: "密码",
      label_password_confirm: "确认密码",
      placeholder_name: "请输入用户名",
      placeholder_password: "请输入密码",
      placeholder_password_confirm: "请确认密码",
      btn_login: "立即登录",
      btn_register: "立即注册",
      password_not_confirm: "两次密码不一致",
      login_error: "登录失败，请检查用户名和密码",
      login_success: "欢迎: ",
      register_error: "注册失败，请检查用户名"
    }
  }
};
