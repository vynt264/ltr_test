import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
} from "typeorm";
import { BaseEntity } from "src/common/mysql/base.entity";
import { Order } from "src/components/orders/entities/order.entity";

@Entity({ name: "winning-numbers" })
export class WinningNumber extends BaseEntity {
    @ManyToOne(() => Order, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    order: Order;

    @Column({ type: 'text', nullable: true })
    winningNumbers: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    turnIndex: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    type: string;

    @Column({
        nullable: true,
        default: false,
    })
    isTestPlayer: boolean;
}
