import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { BookMaker } from "../bookmaker/bookmaker.entity";

@Entity({ name: "lottery_award" })
@Index("type_turn_index_unique", ["type", "turnIndex", "bookmaker", "isTestPlayer"], { unique: true })
export class LotteryAward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 63, nullable: true })
  type: string;

  @Column({ type: 'varchar', length: 63, nullable: true })
  turnIndex: string;

  @Column({ type: 'text', nullable: true })
  awardDetail: string;

  @Column({ type: 'timestamp', nullable: true })
  openTime: Date;

  @Column({ type: 'int', nullable: true })
  totalRevenue: number;

  @Column({ type: 'int', nullable: true })
  totalPayout: number;

  @Column({ type: 'int', nullable: true })
  totalProfit: number;

  @Column({ type: 'int', nullable: true })
  bonusPrice: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => BookMaker, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  bookmaker: BookMaker;

  @Column({
    nullable: true,
    default: false,
  })
  isTestPlayer: boolean;
}
