import { BaseEntity } from "src/common/mysql/base.entity";
import {
    Column, Entity,
} from "typeorm";

@Entity({ name: "management-bonus-price" })
export class ManageBonusPrice extends BaseEntity {
    @Column({ type: 'varchar', nullable: true })
    fromDate: string; // miliseconds

    @Column({ type: 'varchar', nullable: true })
    toDate: string; // miliseconds

    @Column({ type: 'int', nullable: true })
    totalBet: number;

    @Column({ type: 'int', nullable: true })
    totalProfit: number;

    @Column({ type: 'int', nullable: true })
    bonusPrice: number;

    @Column({ type: 'varchar', nullable: true })
    type: string;

    @Column({ type: 'varchar', nullable: true })
    isTestPlayer: boolean;
}
