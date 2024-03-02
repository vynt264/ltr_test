import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("play_history_poker")
export class PlayHistoryPoker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  bookmakerId: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  play1st: string;

  @Column({ nullable: true })
  play2nd: string;

  @Column({ nullable: false })
  revenue: number;

  @Column({ nullable: true })
  multi: number;

  @Column({ nullable: true })
  paymentWin: number;

  @Column({ nullable: true })
  rewardTitle: string;

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