import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity({ name: "data_fake" })
export class DataFake {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  username: string;

  @Column({ type: "text", nullable: true })
  avatar: string;

  @Column({ nullable: true })
  gameType: string;

  @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
  paymentWin: number;

  @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
  revenue: number;

  @Column({ nullable: true })
  numbPlayer: number;

  @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
  totalBet: number;

  @Column({ nullable: false })
  keyMode: string;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    name: "createdAt",
  })
  public createdAt!: Date;
}