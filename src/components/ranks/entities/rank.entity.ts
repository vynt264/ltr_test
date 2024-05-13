import { BaseEntity } from "src/common/mysql/base.entity";
import { Column, Entity } from "typeorm";

export enum UserRank {
    BRONZE = 'bronze',
    SILVER = 'silver',
    GOLD = 'gold',
    PLATIUM = 'platium',
    DIAMOND = 'diamond',
    IMMORTAL = 'immortal',
};

@Entity("ranks")
export class Rank extends BaseEntity {
    @Column({
        type: "enum",
        enum: UserRank,
        default: UserRank.BRONZE,
    })
    rankName: string;

    @Column({ nullable: false })
    maxBetAmount: number;
}
