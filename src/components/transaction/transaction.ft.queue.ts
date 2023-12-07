import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("transaction_ft_queue")
export class TransFtQueue {
  @PrimaryGeneratedColumn()
  id: number;
}
