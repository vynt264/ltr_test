export class DateTimeHelper {
    public static formatDate(date: Date) {
        const mm = date.getMonth() + 1;
        const dd = date.getDate();
        const yy = date.getFullYear();

        return `${yy}${mm}${dd}`;
    }
}