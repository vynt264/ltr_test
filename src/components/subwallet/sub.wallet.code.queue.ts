import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "sub_wallet_code_queue" })
export class SubWalletCodeQueue {
  @PrimaryGeneratedColumn()
  id: number;
}
