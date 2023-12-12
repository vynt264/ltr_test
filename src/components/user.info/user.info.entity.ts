import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user/user.entity";

@Entity("user_info")
export class UserInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  sumBet: number;

  @Column({ 
    nullable: false,
    default: 0,
  })
  sumOrder: number;

  @Column({ 
    nullable: false,
    default: 0,
  })
  sumOrderWin: number;

  @Column({ 
    nullable: false,
    default: 0,
  })
  sumOrderLose: number;

  @Column({ nullable: true })
  favoriteGame: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
