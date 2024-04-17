import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("play_history_keno")
export class PlayHistoryKeno {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  bookmakerId: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: true, default: false })
  isUserFake: boolean;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  typeBet: string;

  @Column({ nullable: false })
  kenoHitBet: string;

  @Column({ nullable: false })
  kenoHitResult: string;

  @Column({ nullable: false })
  multi: string;

  @Column({ nullable: false })
  hits: number;

  @Column({ nullable: false })
  revenue: number;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  totalPaymentWin: number;

  @Column({ nullable: false })
  isGameOver: boolean;

  @CreateDateColumn({
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  createdBy: string;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updatedAt: Date;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  updatedBy: string;
}