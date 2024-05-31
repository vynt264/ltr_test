import { ConfigData } from "./config.interface";

export const DEFAULT_CONFIG: ConfigData = {
  env: "",
  port: 3000,
  logLevel: "info",
  gatekeeperServiceUrl: undefined,
};

export const FE_URL_1 = 'http://vntop.game.game8b.com';
export const FE_URL_2 = 'http://supper.rich.lottery.game8b.com';
export const PROFIT_PERCENTAGE_KEY = 'PROFIT_PERCENTAGE';
export const IS_BONUS_KEY = 'IS_BONUS_KEY';
export const IS_MAX_PAYOUT = 'IS_MAX_PAYOUT';
export const BONUS_CONFIG = 'BONUS_CONFIG';
export const NUMBER_OF_PLAYERS_PLACING_ORDERS = 'NUMBER_OF_PLAYERS_PLACING_ORDERS';
export const PROFIT_PERCENTAGE = 5;