import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("lottery_ft_queue")
export class LotteryFtQueue {
  @PrimaryGeneratedColumn()
  id: number;
}