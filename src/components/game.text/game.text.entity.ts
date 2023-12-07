import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("game_text")
export class GameText {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  category: string;

  @Column({ nullable: false })
  betType: string;

  @Column({ nullable: false })
  childBetType: string;

  @Column({ type: "text", nullable: false })
  howToPlay: string;

  @Column({ type: "text", nullable: true })
  tutorial: string;

  @Column({ type: "text", nullable: true })
  maxReward: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}