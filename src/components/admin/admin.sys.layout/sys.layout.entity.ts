import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("sys_layout")
export class SysLayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  sys_key: string;

  @Column({ type: "text", nullable: true })
  sys_value: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ nullable: false })
  createdBy: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @Column({ nullable: true })
  updatedBy: string;
}
