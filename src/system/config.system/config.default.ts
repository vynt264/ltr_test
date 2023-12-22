import { ConfigData } from "./config.interface";

export const DEFAULT_CONFIG: ConfigData = {
  env: "",
  port: 3000,
  logLevel: "info",
  gatekeeperServiceUrl: undefined,
};


export const FE_URL = 'http://192.168.120.17:4000';