import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
@Entity({ name: "backlist" })
export class Backlist {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: "text", nullable: false })
  public acToken: string;

  @Column({
    nullable: false,
  })
  public userId: number;

  @Column({
    default: 1,
  })
  public status: number;

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
