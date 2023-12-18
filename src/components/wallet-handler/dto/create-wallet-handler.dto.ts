import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { User } from "src/components/user/user.entity";
import { JoinColumn, ManyToOne } from "typeorm";

export class CreateWalletHandlerDto {
    @ManyToOne(() => User, {
        cascade: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    user: User;

    balance: number;

    createdBy: string;
}
