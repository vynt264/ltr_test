import { ConfigData } from "./config.interface";

export const DEFAULT_CONFIG: ConfigData = {
  env: "",
  port: 3000,
  logLevel: "info",
  gatekeeperServiceUrl: undefined,
};

export const FE_URL_1 = 'http://app.vntop.net';
export const FE_URL_2 = 'http://admin.vntop.net';
export const PROFIT_PERCENTAGE = 5;