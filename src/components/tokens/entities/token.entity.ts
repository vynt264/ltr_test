import { BaseEntity } from "src/common/mysql/base.entity";
import { User } from "src/components/user/user.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "tokens" })
export class Token extends BaseEntity {
    @ManyToOne(() => User, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    user: User;

    @Column({ type: 'text', nullable: true })
    token: string;

    @Column({ type: 'varchar', nullable: true })
    devide: string;

    @Column({
        nullable: true,
        default: false,
    })
    isTestPlayer: boolean;
}
