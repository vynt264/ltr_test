import { Device } from "./../device/device.entity";
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { User } from "../user/user.entity";

@Entity({ name: "user_histories" })
export class UserHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", default: 1 })
  count: number;

  @Column({
    type: "varchar",
    length: 50,
    nullable: false,
  })
  action: string;

  @OneToOne(() => Device, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  device: Device;

  @ManyToOne(() => User, (user) => user.id, {
    cascade: true,
    createForeignKeyConstraints: false,
  })
  user: User;

  @Column({
    type: "varchar",
    length: 200,
    nullable: false,
  })
  note: string;

  @Column({ type: "boolean", default: false })
  isDeleted: number;

  @CreateDateColumn({
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updatedAt: Date;
}
