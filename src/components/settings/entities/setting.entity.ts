import { BaseEntity } from "src/common/mysql/base.entity";
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";

export class Setting extends BaseEntity {
    @Column({ type: 'numeric' })
    profit: number;
}
