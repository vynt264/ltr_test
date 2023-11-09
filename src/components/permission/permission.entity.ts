import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
@Entity({ name: "permissions" })
export class Permission {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, nullable: false })
  public role: string;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    name: "createdAt",
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
    name: "updatedAt",
  })
  public updatedAt!: Date;
}
