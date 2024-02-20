import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("play_history_hilo")
export class PlayHistoryHilo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  step: number;

  @Column({ nullable: false })
  cards: string;

  @Column({ nullable: false })
  multi: string;

  @Column({ nullable: true })
  hiLo: string;

  @Column({ nullable: true })
  multiHis: string;

  @Column({ nullable: false })
  revenue: number;

  @Column({ 
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  higher: number;

  @Column({ 
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  lower: number;

  @Column({ 
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: true,
    default: 0,
  })
  higherWin: number;

  @Column({ 
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: true,
    default: 0,
  })
  lowerWin: number;

  @Column({ 
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  totalPaymentWin: number;

  @Column({ nullable: false })
  skipPrevious: boolean;

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