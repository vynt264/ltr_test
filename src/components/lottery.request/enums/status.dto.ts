// import { BaseGiaiDto } from "../dto/base2so.dto";

// export enum RateCaculation {
//   De_Dau = 99,
//   De_Dac_Biet = 99.1,
//   De_Dau_Duoi = 99,
//   Lo_2_So = 99.5 / 18.0,
//   Lo_2_So_1k = 5.45,
//   Lo_3_So = 980/17,
//   Lo_4_So = 9000/16,
// }

// export enum TypeCaculation {
//   De_Dau = "De_Dau",
//   De_Dac_Biet = "De_Dac_Biet",
//   De_Dau_Duoi = "De_Dau_Duoi",
//   Lo_2_So = "Lo_2_So",
//   Lo_2_So_1k = "Lo_2_So_1k",
//   Lo_3_So = "Lo_3_So",
//   Lo_4_So = "Lo_4_So",
// }

// export interface MatricInt {
//   value: number;
//   giai0Pay: number;
//   giai0Revenue: number;
//   giai8Pay: number;
//   giai8Revenue: number;
//   giaiLoPay: number;
//   giaiLoRevenue: number;
// }

// export interface MatricMore2SoOther {
//   value: number;
//   pay: number;
// }

// export interface LotteryInfo {
//   mapMatricInt: Map<number, MatricInt>; // ma trận giải và giải thưởng
//   matricMore2SoOther: MatricMore2SoOther[]; // trọng số đơn > 2 số(lô 3 số, lô 4 số, 3 càng, 4 càng)
//   totalRevenue: number; // tổng DTC
//   rateDeWin: number; // tỉ lệ cho phép có ra ĐỀ
//   maxlength2so: number; // 100
//   minWinNhaCai: number; // min số tiền nhà cái win
//   rootTotalRevenue: number; //tổng DTC gốc
//   arrAwardStr: string[]; // giải thưởng int
//   arrAwardInt: number[]; // giải thưởng string
//   totalPayment: number;
// }

// export interface MatricGiai {
//   arrGiai0: BaseGiaiDto[];
//   arrGiai8: BaseGiaiDto[];
//   arrGiaiLo: BaseGiaiDto[];
//   whiteListLo: number[];
//   whiteListGia0: number[];
//   whiteListGia8: number[];
//   arrAwardInt: number[];
// }
