import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("commons")
export class Common {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  common_key: string;

  @Column({ type: 'text', nullable: true })
  common_value: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', nullable: true })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 125, nullable: true })
  updatedBy: string;
}