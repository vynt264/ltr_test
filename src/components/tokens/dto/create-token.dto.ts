import { User } from "src/components/user/user.entity";
import { JoinColumn, ManyToOne } from "typeorm";

export class CreateTokenDto {
    @JoinColumn()
    user: User;

    token: string;

    devide: string;

    isTestPlayer: boolean;
}
