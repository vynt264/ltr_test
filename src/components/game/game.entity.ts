import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("games")
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  category: string;

  @Column({ nullable: false })
  parrentType: string;

  @Column({ nullable: false })
  type: string;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 5,
    nullable: true,
    default: 0,
  })
  sumBet: number;

  @Column({ nullable: true })
  textView: string;

  @Column({ nullable: true })
  image: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}