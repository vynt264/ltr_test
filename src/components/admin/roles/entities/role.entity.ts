import { BaseEntity } from "src/common/mysql/base.entity";
import { Column, Entity } from "typeorm";

@Entity("roles")
export class Role extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'text', nullable: true })
    permissions: string;
}
