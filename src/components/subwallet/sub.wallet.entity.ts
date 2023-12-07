import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { User } from "../user/user.entity";

@Entity({ name: "sub_wallet" })
@Index("sub_wallet_code_unique", ["subWalletCode"], { unique: true })
@Index("user_game_code_unique", ["user", "gameCode"], { unique: true })
export class SubWallet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  user: User;

  @Column({ length: 63, nullable: true })
  subWalletCode: string;

  @Column({ length: 63, nullable: true })
  walletCode: string;

  @Column({ length: 63, nullable: true })
  gameCode: string;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  balance: number;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  availableBalance: number;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  holdBalance: number;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  totalUsedAmount: number;

  @Column({ nullable: false, default: 0 })
  version: number;

  @Column({ length: 255, nullable: true })
  description: string;

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
