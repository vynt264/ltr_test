import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user/user.entity";

@Entity("bookmaker")
export class BookMaker {
  @PrimaryGeneratedColumn()
  id: number;

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