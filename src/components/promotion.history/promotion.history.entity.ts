import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne
} from "typeorm";
import { User } from "../user/user.entity";
import { Promotion } from "../promotion/promotion.entity";

@Entity({ name: "promotion_histories" })
export class PromotionHistories {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Promotion, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  promotion: Promotion;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  moneyReward: number;

  @CreateDateColumn({
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;
}