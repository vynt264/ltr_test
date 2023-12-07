import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("transaction")
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, length: 63 })
  walletCode: string;

  @Column({ nullable: true, length: 63 })
  subWalletCode: string;

  @Column({ length: 125, nullable: true })
  username: string;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: false,
    default: 0,
  })
  amount: number;

  @Column({ type: "decimal", precision: 65, scale: 5, nullable: true })
  deposit: number;

  @Column({ type: "decimal", precision: 65, scale: 5, nullable: true })
  revenue: number;

  @Column({ type: "decimal", precision: 65, scale: 5, nullable: true })
  rate: number;

  @Column({ length: 63, nullable: true })
  ft: string;

  @Column({ length: 63, nullable: false })
  transRef1: string;

  @Column({ length: 63, nullable: false })
  transType: string;

  @Column({ length: 63, nullable: false })
  method: string;

  @Column({ length: 15, nullable: false })
  status: string;

  @Column({ length: 255, nullable: true })
  note: string;

  @Column({ length: 255, nullable: true })
  approverNote: string;

  @Column({ length: 255, nullable: true })
  errorReason: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ length: 255, nullable: false })
  createdBy: string;

  @Column({ type: "timestamp", nullable: true })
  approvedAt: Date;

  @Column({ length: 255, nullable: true })
  approvedBy: string;
}
