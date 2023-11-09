import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { User } from "../user/user.entity";

@Entity({ name: "order_request_his" })
export class OrderRequestHis {

  @PrimaryGeneratedColumn({ type: 'bigint' })
  idHis: number;
  
  @Column({ type: 'bigint', nullable: false })
  id: number;

  @ManyToOne(() => User, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  user: User;

  @Column({ type: 'varchar', length: 31, nullable: true })
  type: string;

  @Column({ type: 'varchar', length: 31, nullable: true })
  turnIndex: string;

  @Column({ type: 'varchar', length: 31, nullable: true })
  orderCode: string;

  @Column({ type: 'varchar', length: 31, nullable: true })
  playType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  detail: string;

  @Column({ length: 31, nullable: true })
  ft: string;
  
  @Column({ type: 'int', nullable: true })
  count: number;

  @Column({ type: 'decimal', precision: 65, scale: 5, nullable: true })
  amount: number;

  @Column({ type: 'int', nullable: true })
  status: number;

  @Column({ type: 'boolean', nullable: true })
  isExpired: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  isNoti: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  createdAt: Date;

  @Column({ type: 'varchar', length: 125, nullable: true })
  createdBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', nullable: true })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 125, nullable: true })
  updatedBy: string;
}
