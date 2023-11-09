import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "apis" })
@Index("api_UNIQUE", ["api"], { unique: true })
export class API {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  api: string;

  @Column({
    nullable: false,
  })
  action: string;

  @Column({
    nullable: false,
  })
  department: string;

  @Column({ type: "boolean", default: true })
  isActive: number;

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
