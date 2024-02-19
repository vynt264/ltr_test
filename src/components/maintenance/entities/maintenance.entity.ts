import { BaseEntity } from "src/common/mysql/base.entity";
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";

enum MaintenanceStatus {
    progress = "progress",
    completed = "completed",
    canceled = "canceled",
}

@Entity({ name: "maintenance" })
export class Maintenance extends BaseEntity {
    @Column({ type: 'timestamp', nullable: true })
    startTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    completionTime: Date;

    @Column({ type: 'varchar', length: 255 , nullable: true })
    description: string;

    @Column({
        type: "enum",
        enum: MaintenanceStatus,
        default: MaintenanceStatus.completed,
    })
    status: string;

    @Column({
        type: "boolean",
        default: false,
    })
    immediateMaintenance: boolean;
}
