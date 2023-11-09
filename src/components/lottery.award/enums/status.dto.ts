export enum StatusTicket {
  INIT = "INIT",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
}

export enum ScratchedIndex {
  CHECKIN = -1,
  PICK = 0,
  SCRATCHED_1 = 1,
  SCRATCHED_2 = 2,
  SCRATCHED_3 = 3,
  SCRATCHED_4 = 4,
  SCRATCHED_FULL = 5,
}

export enum TypeLottery {
  XSMB = "xsmb",
  XSN_TEST = "xsn_demo",
  XSN_45s = "xsn_45s",
  // mien bac
  XSMB_1_S = "xsmb1s",
  XSMB_45_S = "xsmb45s",
  XSMB_180_S = "xsmb180s",
  // mien trung
  XSMT_1_S = "xsmt1s",
  XSMT_45_S = "xsmt45s",
  XSMT_180_S = "xsmt180s",
  // mien nam
  XSMN_1_S = "xsmn1s",
  XSMN_45_S = "xsmn45s",
  XSMN_180_S = "xsmn180s",
  // supper rick lottery
  XSSPL_1_S = "xsspl1s",
  XSSPL_45_S = "xsspl45s",
  XSSPL_60_S = "xsspl60s",
  XSSPL_90_S = "xsspl90s",
  XSSPL_120_S = "xsspl120s",
  XSSPL_360_S = "xsspl360s",
}

export interface CurrentAwardXsmb {
  type: any;
  award: any;
  nextTime: any;
  nextTurnIndex: any;
}

export interface CurrentXsmb {
  xsmb: any;
  xsmb45s: any;
}

export enum CharLottery {
  PIPE = "|",
  COMMA = ",",
}

export enum StatusLotteryAward {
  INIT = 1,
  ERROR = 2,
  SUCCESS = 3,
}