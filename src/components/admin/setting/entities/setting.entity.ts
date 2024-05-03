import { BaseEntity } from "src/common/mysql/base.entity";
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";

@Entity("admin-settings")
export class Setting extends BaseEntity {
    @Column({ type: 'numeric' })
    profit: number;

    @Column({ type: 'boolean', default: true })
    isUseBonus: boolean;

    @Column({ type: 'boolean', default: true })
    isMaxPayout: boolean; // random awards co payout lon nhat

    @Column({ type: 'numeric', default: 3 })
    timeResetBonus: number; // 3h, 6h, 12h
}
