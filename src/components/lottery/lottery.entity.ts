import {
  Column,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity({ name: "lottery" })
export class Lottery {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 31, nullable: true })
  type: string;

  @Column({ type: 'varchar', length: 31, nullable: true })
  turnIndex: string;

  @Column({ type: 'varchar', length: 31, nullable: true })
  transRef1: string;

  @Column({ type: 'varchar', length: 31, nullable: true })
  ft: string;

  @Column({ type: 'json', nullable: true })
  detail: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  award: string;

  @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
  rateWin: number;

  @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
  totalPay: number;

  @Column({ type: 'int', nullable: true })
  totalOrder: number;

  @Column({ type: 'int', nullable: true })
  status: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  extraData: any;

  @Column({ type: 'timestamp', nullable: true })
  openTime: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  createdAt: Date;

  @Column({ type: 'varchar', length: 125, nullable: true })
  createdBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', nullable: true })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 125, nullable: true })
  updatedBy: string;
}
