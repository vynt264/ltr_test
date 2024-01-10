import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from "typeorm";
  import { User } from "../user/user.entity";
  
  @Entity({ name: "wallet_inout" })
  export class WalletInout {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => User, {
      cascade: true,
      createForeignKeyConstraints: false,
    })
    @JoinColumn()
    user: User;
  
    @Column({
      type: "decimal",
      precision: 65,
      scale: 5,
      nullable: false,
      default: 0,
    })
    balanceIn: number;

    @Column({
        type: "timestamp",
        nullable: true,
    })
    timeIn: Date;

    @Column({
        type: "decimal",
        precision: 65,
        scale: 5,
        nullable: false,
        default: 0,
    })
    balanceOut: number;

    @Column({
        type: "timestamp",
        nullable: true,
    })
    timeOut: Date;
  
    @Column({ nullable: false, default: false })
    isDelete: boolean;
  
    @CreateDateColumn({
      type: "timestamp",
      nullable: false,
      default: () => "CURRENT_TIMESTAMP(6)",
    })
    createdAt: Date;
  
    @Column({ length: 255, nullable: false })
    createdBy: string;
  
    @UpdateDateColumn({
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP(6)",
      onUpdate: "CURRENT_TIMESTAMP(6)",
    })
    updatedAt: Date;
  
    @Column({ length: 255, nullable: true })
    updatedBy: string;
  }
  