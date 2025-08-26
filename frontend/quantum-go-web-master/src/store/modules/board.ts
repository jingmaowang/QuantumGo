const state = () => ({
  hoverIndex: 0 as number,
  boardHover: false as boolean
});

const mutations = {
  setHoverIndex(state: any, index: number) {
    state.hoverIndex = index;
  },
  setBoardHover(state: any, status: boolean) {
    state.boardHover = status;
  }
};

const actions = {
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
