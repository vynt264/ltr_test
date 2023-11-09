import { Between } from "typeorm";
import * as moment from "moment";

export class QueryHelper {
  static between(start: Date, end: Date) {
    return Between(start, end);
  }

  static currentMonth() {
    const today = new Date();
    const fromDate = moment(today).startOf("month");
    const toDate = moment(today).endOf("month");
    return this.between(
      new Date(moment(fromDate).format("YYYY-MM-DD")),
      new Date(`${moment(toDate).format("YYYY-MM-DD")}T23:59:59Z`)
    );
  }

  static currentWeek() {
    const today = new Date();
    const fromdate = moment(today).startOf("isoWeek");
    return this.between(new Date(fromdate.format("YYYY-MM-DD")), today);
  }

  static toDay() {
    const today = new Date();
    return this.between(new Date(moment(today).format("YYYY-MM-DD")), today);
  }
}
