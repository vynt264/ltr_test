import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "wallet_code_queue" })
export class WalletCodeQueue {
  @PrimaryGeneratedColumn()
  id: number;
}
