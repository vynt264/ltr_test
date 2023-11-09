import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "sys_configs" })
@Index("module_index", ["module"], { unique: false })
export class SysConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  parentId: number;

  @Column({
    type: "varchar",
    length: 225,
    nullable: false,
  })
  module: string;

  @Column({
    type: "varchar",
    length: 225,
    nullable: false,
  })
  item: string;

  @Column({
    type: "varchar",
    length: 225,
    nullable: true,
  })
  itemCode: string;

  @Column({
    type: "varchar",
    length: 1023,
    nullable: true,
  })
  value: string;

  @Column({
    type: "varchar",
    length: 511,
    nullable: true,
  })
  value1: string;

  @Column({
    type: "varchar",
    length: 511,
    nullable: true,
  })
  value2: string;

  @Column({ type: "boolean", default: false })
  isDeleted: boolean;

  @Column({ type: "boolean", default: false })
  isBlocked: boolean;

  @CreateDateColumn({
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  createdBy: string;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updatedAt: Date;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  updatedBy: string;
}
