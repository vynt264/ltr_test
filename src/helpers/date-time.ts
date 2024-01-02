export class DateTimeHelper {
    public static formatDate(date: Date) {
        const mm = date.getMonth() + 1;
        const dd = date.getDate();
        const yy = date.getFullYear();

        let tempMM = mm.toString();
        if (tempMM.toString().length === 1) {
            tempMM = `0${mm}`;
        }

        let tempDD = dd.toString();
        if (tempDD.toString().length === 1) {
            tempDD = `0${dd}`;
        }

        return `${yy}${tempMM}${tempDD}`;
    }
}