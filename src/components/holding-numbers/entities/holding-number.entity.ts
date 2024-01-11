import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from "typeorm";

import { BaseEntity } from "src/common/mysql/base.entity";

@Entity({ name: "holding-numbers" })
export class HoldingNumber extends BaseEntity {
    @Column({ type: 'varchar', length: 31, nullable: true })
    name: string;

    @Column({
        nullable: true,
        default: true,
    })
    isStop: boolean;
}
