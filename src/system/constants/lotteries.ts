export const ODD_BET = 99.5;
export const PRICE_PER_SCORE = 18000;
export const PRIZES = {
    SPECIAL_PRIZE: "0",
    PRIZE_1: "1",
    PRIZE_2: "2",
    PRIZE_3: "3",
    PRIZE_4: "4",
    PRIZE_5: "5",
    PRIZE_6: "6",
    PRIZE_7: "7",
    PRIZE_8: "8",
};
export const MAX_PERCENT = 100;
export const MAX_ORDERS = 100;
export const MINIUM_PROFIT = 5; // 5%
export const MAX_ORDERS_DAU_DUOI = 7;
export const MAX_ORDERS_LO2SO = 70;
export const MAX_ORDERS_LOXIEN = 70;
export const MAX_ORDERS_LO3SO = 700;
export const MAX_ORDERS_LO4SO = 7000;
export const MAX_NUMBER_PRIZES_OF_LO2SO = 18;
export const MAX_NUMBER_PRIZES_OF_LO3SO = 17;
export const MAX_NUMBER_PRIZES_OF_LO4SO = 16;
export const INIT_TIME_CREATE_JOB = '07:00 AM';
export const START_TIME_CREATE_JOB = 0;
export const MAINTENANCE_PERIOD = 0; // 20p
export const PERIOD_CANNOT_CANCELED = 2; // 2s
export const PERIOD_CANNOT_ORDER = 1; // 1s
export const PERIOD_DELAY_TO_HANDLER_ORDERS = 1000; // miliseconds

export enum TypeLottery {
    // mien bac
    XSMB_1S = "xsmb1s",
    XSMB_45S = "xsmb45s",
    XSMB_180S = "xsmb180s",

    // mien trung
    XSMT_1S = "xsmt1s",
    XSMT_45S = "xsmt45s",
    XSMT_180S = "xsmt180s",

    // mien nam
    XSMN_1S = "xsmn1s",
    XSMN_45S = "xsmn45s",
    XSMN_180S = "xsmn180s",

    // supper rick lottery
    XSSPL_1S = "xsspl1s",
    XSSPL_45S = "xsspl45s",
    XSSPL_60S = "xsspl60s",
    XSSPL_90S = "xsspl90s",
    XSSPL_120S = "xsspl120s",
    XSSPL_360S = "xsspl360s",
};
