import * as bcrypt from "bcrypt";
import {
    BeforeInsert,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Bookmaker } from "../../bookmaker/entities/bookmaker.entity";
import { BcryptSalt } from "src/system/constants/bcrypt.salt";
import { UserRoles } from "src/components/user/enums/user.enum";
import { BaseEntity } from "src/common/mysql/base.entity";
import { Role } from "../../roles/entities/role.entity";

@Entity({ name: "admin-users" })
export class AdminUser extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ unique: false, nullable: false })
    public username: string;

    @Column({ nullable: true })
    public password: string;

    @ManyToOne(() => Bookmaker, (bookmaker) => bookmaker.id, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    bookmaker: Bookmaker;

    @Column({ type: "enum", enum: UserRoles, default: UserRoles.MEMBER })
    role: UserRoles;

    @ManyToOne(() => Role, (role) => role.id, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    roleAdminUser: Role;

    @BeforeInsert()
    async hashPassword() {
        if (!this.password) return;

        const salt = await bcrypt.genSalt(BcryptSalt.SALT_ROUND);
        this.password = await bcrypt.hash(this.password, salt);
    }
}
