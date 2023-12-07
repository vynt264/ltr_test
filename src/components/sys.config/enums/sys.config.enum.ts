enum SysModuleEnum {
  MULTIPLE = "MULTIPLE",
  REGULATION = "REGULATION",
  TICKET_1 = "TICKET1",
  TICKET_2 = "TICKET2",
  TICKET_3 = "TICKET3",
  CONDITION = "CONDITION",
  GAME_CODE = "GAME_CODE",
  NOTI = "NOTI",
}

enum SysItemEnum {
  TICKET_1_TIME_CYCLE = "ticket_1_time_cycle",
  TICKET_1_NEXT_TIME_CYCLE = "ticket_1_next_time_cycle",
  TICKET_1_CHECKIN_FROM = "tick_1_checkin_from",
  TICKET_1_CHECKIN_TO = "tick_1_checkin_to",
  TICKET_1_MULTIPLE = "tick_1_multiple",
  TICKET_1_POINT_MIN = "tick_1_point_min",
  TICKET_1_POINT_MAX = "tick_1_point_max",
  TICKET_1_POINT_DRAW_N = "tick_1_point_draw_n",
  TICKET_1_MAINTENANCE = "ticket_1_maintenance",
  MULTIPLE = "multiple",
  REGULATION_RULE = "rule",
  REGULATION_CONTENT = "content",
  TICKET_3_DEPOSIT_CONDITION = "ticket_3_deposit_condition",
  TICKET_3_AWARD_POINT = "ticket_3_award_point",
  TICKET_3_MULTIPE = "ticket_3_multipe",
  // format hh:mm:ss
  TICKET_3_TIME_CONFIG = "ticket_3_time_config",
  TICKET_3_NEXT_TIME = "ticket_3_next_time",
  TICKET_3_PICK_USER = "ticket_3_pick_user",
  TICKET_3_MAINTENANCE = "ticket_3_maintenance",
  TICKET_2_PAYMENT = "ticket_2_payment",
  TICKET_2_MAINTENANCE = "ticket_2_maintenance",
  TICKET_2_NEXT_TIME_CYCLE = "ticket_2_next_time_cycle",
  TICKET_1_AWARD_CONGUL = "ticket_1_award_congul",
  TICKET_2_AWARD_CONGUL = "ticket_2_award_congul",
  TICKET_3_AWARD_CONGUL = "ticket_3_award_congul",
  CONDITION_RATE = "condition_rate",
  CONDITION_DEPOSIT = "condition_deposit",
  MINI_GAME_LUCKY_TICKET = "mini_game_lucky_ticket",
  MINI_GAME_LUCKY_WHEEL = "mini_game_lucky_wheel",
  NOTI_TRAFFIC_LIGHT = "traffic_light",
  LOCK_EARN = "lock_earn",
  LOCK_TRANSFER = "lock_transfer",
  LOCK_PLAY = "lock_play",
}

interface ValueRate {
  value: any;
  rate: number;
}

enum SysTtemCodeEnum {
  TITLE = "TITLE",
  CONDITION_DEPOSIT = "CONDITION_DEPOSIT",
  CONDITION_REVENUE = "CONDITION_REVENUE",
  OPTION_POINT = "OPTION_POINT",
  OPTION_MULTIPE = "OPTION_MULTIPE",
}

function getCalculateRate(list: ValueRate[]): any {
  if (!list || list.length === 0) return 0;
  let randomNumber = Math.random();

  for (let i = 0; i < list.length; i++) {
    if (randomNumber < list[i].rate) {
      return list[i].value;
    } else {
      randomNumber -= list[i].rate;
    }
  }

  return list[list.length - 1].value;
}

export enum StatusSend {
  // user
  INIT = "INIT",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
  // admin
  REQUEST = "REQUEST",
  REJECT = "REJECT",
  AUTO = "AUTO",
}

export enum StatusMaintenance {
  YES = "YES",
  NO = "NO",
}

export enum PaymentEnum {
  COIN = "COIN",
  NOT_COIN = "NOT_COIN",
}

export enum PrefixEnum {
  WALLET_CODE = "EW",
  FT = "FT",
  SUB_WALLET_CODE = "SW",
  LOTTTERY_REQUEST =  "XS",
  LOTTTERY_ORDER = "LT",
}

export enum SystemEnum {
  SYSTEM = 'system',
}


export {
  SysItemEnum as SYS_ITEM_ENUM,
  SysModuleEnum as SYS_MODULE_ENUM,
  ValueRate,
  getCalculateRate,
  SysTtemCodeEnum as SysTtemCodeEnum,
};

export function genRandom(min: number, max: number): number {
  const randomDecimal = Math.random();
  const randomNumber = Math.floor(randomDecimal * (max - min + 1)) + min;
  return randomNumber;
}
