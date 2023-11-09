import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "devices" })
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
    length: 100,
    nullable: false,
  })
  mac: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: false,
  })
  ip: string;

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
