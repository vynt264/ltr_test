import { BaseEntity } from "src/common/mysql/base.entity";
import {
    Column,
    Entity,
} from "typeorm";

@Entity("admin-settings")
export class Setting extends BaseEntity {
    @Column({ type: 'numeric' })
    profit: number;

    @Column({ type: 'boolean', default: true })
    isUseBonus: boolean;

    @Column({ type: 'boolean', default: false })
    isMaxPayout: boolean; // get awards co payout lon nhat

    @Column({ type: 'numeric', default: false })
    timeResetBonus: number; // 3h, 6h, 12h

    @Column({ type: 'varchar' })
    limitBetAmount: string; // all users
}
