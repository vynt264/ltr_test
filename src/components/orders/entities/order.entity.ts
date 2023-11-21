import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { User } from "../../user/user.entity";
import { BaseEntity } from "src/common/mysql/base.entity";

enum OrderStatus {
    closed = "closed",
    pending = "pending",
    canceled = "canceled",
}

@Entity({ name: "orders" })
export class Order extends BaseEntity {

    @ManyToOne(() => User, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    user: User;

    @Column({ type: 'varchar', length: 31, nullable: true })
    numericalOrder: string;

    @Column()
    multiple: number;

    @Column({ type: 'varchar', length: 31, nullable: true })
    type: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    turnIndex: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    orderCode: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    betType: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    childBetType: string;

    @Column({ type: 'varchar', length: 255, nullable: true })

    @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
    revenue: number;

    @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
    paymentWin: number;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.pending,
    })
    status: string;
}
