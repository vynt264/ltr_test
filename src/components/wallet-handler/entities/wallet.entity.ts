import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { User } from "../../user/user.entity";
import { BaseEntity } from "src/common/mysql/base.entity";

@Entity({ name: "wallet" })
export class Wallet extends BaseEntity {
    @ManyToOne(() => User, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    user: User;

    @Column({
        type: "decimal",
        precision: 65,
        scale: 5,
        nullable: false,
        default: 0,
    })
    balance: number;
    
    @Column({ length: 255, nullable: false })
    createdBy: string;
}
