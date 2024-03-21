import { BaseEntity } from "src/common/mysql/base.entity";
import { BookMaker } from "src/components/bookmaker/bookmaker.entity";
import {
    Column, Entity, JoinColumn, ManyToOne,
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

    @ManyToOne(() => BookMaker, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    bookMaker: BookMaker;
}
