import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user/user.entity";
import { BaseEntity } from "src/common/mysql/base.entity";

@Entity("bookmaker")
export class BookMaker extends BaseEntity {
  @Column({ nullable: false })
  name: string;

  @Column({ type: "text", nullable: true })
  gameReg: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
    nullable: true,
  })
  updatedAt: Date;

  @Column({ type: "varchar", length: 125, nullable: true })
  updatedBy: string;

  @OneToMany(() => User, (User) => User.bookmaker)
  users: User[];
}