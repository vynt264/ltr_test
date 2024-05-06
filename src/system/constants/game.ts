import { TypeLottery } from "./lotteries";

const GAMES = {
    XoSo: 'xoso',
    Casino: 'casino',
};

const LOTTERIES_GAME_TYPES = TypeLottery;

const CASINO_GAME_TYPES = {
    HILO: 'hilo',
    VIDEO_POKER: 'video-poker',
    MINES: 'mines',
};

const ALL_GAME_TYPES = { ...LOTTERIES_GAME_TYPES, ...CASINO_GAME_TYPES };

export {
    GAMES,
    LOTTERIES_GAME_TYPES,
    CASINO_GAME_TYPES,
    ALL_GAME_TYPES,
};