import { Md5 } from "md5-typescript";
import { ConfigSys } from "./config";

export class Helper {
  static convertTime(time: Date) {
    const date = new Date(`${time.toLocaleDateString()}`);
    if (this.checkMonth(date.getMonth()) && this.checkDate(date.getDate())) {
      return this.formatTime(date, true, true);
    }

    if (!this.checkMonth(date.getMonth()) && this.checkDate(date.getDate())) {
      return this.formatTime(date, false, true);
    }

    if (this.checkMonth(date.getMonth()) && !this.checkDate(date.getDate())) {
      return this.formatTime(date, true, false);
    }

    return this.formatTime(date, false, false);
  }

  private static checkDate(date: number) {
    if (date <= 31 && date >= 10) {
      return false;
    }

    return true;
  }

  private static checkMonth(month: number) {
    if (month + 1 < 10 && month + 1 >= 1) {
      return true;
    }

    return false;
  }

  private static formatTime(time: Date, flag1 = false, flag2 = false) {
    if (flag1 && flag2) {
      return `${time.getFullYear()}0${time.getMonth() + 1}0${time.getDate()}`;
    }

    if (!flag1 && flag2) {
      return `${time.getFullYear()}${time.getMonth() + 1}0${time.getDate()}`;
    }

    if (flag1 && !flag2) {
      return `${time.getFullYear()}0${time.getMonth() + 1}${time.getDate()}`;
    }

    return `${time.getFullYear()}${time.getMonth() + 1}${time.getDate()}`;
  }

  static endCode(str: string) {
    return Md5.init(`${str}|${ConfigSys.config().sign}`);
  }

  static endCodeUsername(str: string) {
    return Md5.init(`${str}|${ConfigSys.config().signUserName}`);
  }

  static getDate() {
    const today = new Date();
    return {
      today,
      yesterday: today,
    };
  }

  static formatDateToString(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
  }

  static formatDateToYYMMDD(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${year}${month}${day}`;
  }
}
