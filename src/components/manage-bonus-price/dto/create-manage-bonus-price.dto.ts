import { BookMaker } from "src/components/bookmaker/bookmaker.entity";
import { JoinColumn } from "typeorm";

export class CreateManageBonusPriceDto {
    fromDate: string; // miliseconds

    toDate: string; // miliseconds

    totalBet: number;

    totalProfit: number;

    bonusPrice: number;

    type: string;

    isTestPlayer: boolean;

    @JoinColumn()
    bookMaker: BookMaker;
}
