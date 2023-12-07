import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
// import { User } from "../user/user.entity";
import { CoinWallet } from "../coin.wallet/coin.wallet.entity";

@Entity({ name: "coin_wallet_histories" })
export class CoinWalletHistories {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CoinWallet, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  coinWallet: CoinWallet;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  amount: number;

  @Column({
    type: String,
    nullable: false,
  })
  type: string;

  @Column({
    type: String,
    nullable: false,
  })
  status: string;

  @CreateDateColumn({
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;
}
