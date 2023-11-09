import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("order_code_queue")
export class OrderCodeQueue {
  @PrimaryGeneratedColumn()
  id: number;
}
