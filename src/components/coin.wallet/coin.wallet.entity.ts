import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import { CoinWalletHistories } from "../coin.wallet.history/coin.wallet.history.entiry";

@Entity({ name: "coin_wallet" })
export class CoinWallet {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  user: User;

  @OneToMany(() => CoinWalletHistories, (coinWalletHistories) => coinWalletHistories.coinWallet)
  coinWalletHistories: CoinWalletHistories[];

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  balance: number;

  @CreateDateColumn({
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;
}
