import {createStore} from 'vuex';
import user from './modules/user';
import game from './modules/game';
import board from './modules/board';
import lang from './modules/lang';

export default createStore({
    modules: {
        user,
        game,
        board,
        lang
    }
})
