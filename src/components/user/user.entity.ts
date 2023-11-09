import * as bcrypt from "bcrypt";
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BcryptSalt } from "../../system/constants/bcrypt.salt";
import { UserHistory } from "../user.history/user.history.entity";
import { UserRoles } from "./enums/user.enum";
import { OrderRequest } from "../order.request/order.request.entity";
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

  @Column({ type: "boolean", default: true })
  isAuth: boolean;

  @OneToMany(() => UserHistory, (userHistory) => userHistory.user)
  histories: UserHistory[];

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
