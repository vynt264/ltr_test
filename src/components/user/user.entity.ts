import * as bcrypt from "bcrypt";
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BcryptSalt } from "../../system/constants/bcrypt.salt";
import { UserHistory } from "../user.history/user.history.entity";
import { Wallet } from "../wallet/wallet.entity";
import { WalletHistory } from "../wallet/wallet.history.entity";
import { UserRoles } from "./enums/user.enum";
import { UserInfo } from "../user.info/user.info.entity";
import { CoinWallet } from "../coin.wallet/coin.wallet.entity";
import { OrderRequest } from "../order.request/order.request.entity";
import { BookMaker } from "../bookmaker/bookmaker.entity";
@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ nullable: true })
  public name: string;

  @Column({ nullable: true })
  public email: string;

  @Column({ unique: true, nullable: false })
  public username: string;

  @Column({ nullable: true })
  public password: string;

  @Column({ nullable: true })
  public hashedRt: string;

  @Column({ type: "enum", enum: UserRoles, default: UserRoles.MEMBER })
  role: UserRoles;

  @Column({ type: "varchar", length: 511, nullable: true, default: "" })
  option: string;

  @Column({ type: "boolean", default: false })
  isDeleted: boolean;

  @Column({ type: "boolean", default: false })
  isBlocked: boolean;

  @Column({ type: "boolean", default: false })
  isAuth: boolean;
  
  @Column({ type: "varchar", length: 255, nullable: true, default: "" })
  usernameReal: string;

  // @OneToMany((type) => Collection, (collection) => collection.user)
  // collections: Collection[];

  @OneToMany(() => UserHistory, (userHistory) => userHistory.user)
  histories: UserHistory[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => WalletHistory, (walletHistory) => walletHistory.user)
  walletHistory: WalletHistory[];

  @OneToOne(() => UserInfo, (userInfo) => userInfo.user)
  userInfo: UserInfo;

  @OneToOne(() => CoinWallet, (coinWallet) => coinWallet.user)
  coinWallet: CoinWallet;

  @ManyToOne(() => BookMaker, (bookmaker) => bookmaker.id, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  bookmaker: BookMaker;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    name: "createdAt",
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
    name: "updatedAt",
  })
  public updatedAt!: Date;

  @BeforeInsert()
  async hashPassword() {
    const salt = await bcrypt.genSalt(BcryptSalt.SALT_ROUND);
    this.password = await bcrypt.hash(this.password, salt);
  }
}
