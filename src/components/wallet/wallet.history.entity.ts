import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";

@Entity({ name: "wallet_history" })
export class WalletHistory {
  @PrimaryGeneratedColumn()
  hisId: number;

  @Column()
  id: number;

  @ManyToOne(() => User, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  user: User;

  @Column({ length: 63, nullable: true })
  walletCode: string;

  @Column({ nullable: true })
  subOrAdd: number;

  @Column({ nullable: true })
  typeTransaction: string;

  @Column({ nullable: true })
  detail: string;

  @Column({ nullable: true })
  nccNote: string;

  @Column({ nullable: true })
  code: string;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: true,
    default: 0,
  })
  amount: number;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  balance: number;

  @Column({ nullable: false, default: false })
  isBlock: boolean;

  @Column({ nullable: false, default: false })
  isDelete: boolean;

  @CreateDateColumn({
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;

  @Column({ length: 255, nullable: false })
  createdBy: string;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
