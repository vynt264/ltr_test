export class CreateManageBonusPriceDto {
    fromDate: string; // miliseconds

    toDate: string; // miliseconds

    totalBet: number;

    totalProfit: number;

    bonusPrice: number;

    type: string;

    isTestPlayer: boolean;
}
