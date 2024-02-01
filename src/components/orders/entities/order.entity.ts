import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { User } from "../../user/user.entity";
import { BaseEntity } from "src/common/mysql/base.entity";
import { BookMaker } from "src/components/bookmaker/bookmaker.entity";
import { WinningNumber } from "src/components/winning-numbers/entities/winning-number.entity";
import { HoldingNumber } from "src/components/holding-numbers/entities/holding-number.entity";

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

    @ManyToOne(() => HoldingNumber, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    holdingNumber: HoldingNumber;

    @ManyToOne(() => BookMaker, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    bookMaker: BookMaker;

    @OneToMany(() => WinningNumber, (WinningNumber) => WinningNumber.order)
    winningNumber: WinningNumber[];

    @Column({ type: 'varchar', length: 31, nullable: true })
    numericalOrder: string;

    @Column({ type: 'numeric' })
    multiple: number;

    @Column({ type: 'varchar', length: 31, nullable: true })
    type: string;

    @Column({ type: 'numeric' })
    seconds: number;

    @Column({ type: 'varchar', length: 31, nullable: true })
    turnIndex: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    orderCode: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    betType: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    betTypeName: string;

    @Column({ type: 'varchar', length: 31, nullable: true })
    childBetType: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    childBetTypeName: string;

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

    @Column({ nullable: true })
    numberOfBets: number;

    @Column({ type: 'varchar' })
    detail: string;

    @Column({
        nullable: true,
        default: false,
    })
    isTestPlayer: boolean;

    @Column({ type: 'varchar', nullable: true })
    openTime: string;

    @Column({ type: 'varchar', nullable: true })
    closeTime: string;
}
