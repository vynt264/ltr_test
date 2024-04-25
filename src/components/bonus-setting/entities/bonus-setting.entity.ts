import { BaseEntity } from "src/common/mysql/base.entity";
import {
    Column,
    Entity,
} from "typeorm";

@Entity({ name: "bonus-setting" })
export class BonusSetting extends BaseEntity {
    @Column({
        type: 'numeric',
        default: 0,
    })
    from: number;

    @Column({
        type: 'numeric',
        default: 0,
    })
    to: number;

    @Column({
        type: 'numeric',
        default: 0,
    })
    percent: number;
}
