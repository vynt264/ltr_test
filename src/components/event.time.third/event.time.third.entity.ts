// import {
//   Column,
//   CreateDateColumn,
//   Entity,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn,
// } from "typeorm";

// @Entity({ name: "event_times" })
// export class EventTime {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({
//     type: "timestamp",
//     nullable: false,
//   })
//   start: Date;

//   @Column({
//     type: "timestamp",
//     nullable: false,
//     default: () => "CURRENT_TIMESTAMP",
//   })
//   end: Date;

//   @Column({
//     type: "varchar",
//     length: 50,
//     nullable: false,
//   })
//   department: string;

//   @Column({
//     type: "varchar",
//     length: 100,
//     nullable: false,
//   })
//   gameName: string;

//   @Column({ type: "smallint", default: 1 })
//   amount: number;

//   @Column({ type: "boolean", default: false })
//   isDeleted: number;

//   @Column({ type: "boolean", default: false })
//   isLock: boolean;

//   @CreateDateColumn({
//     type: "timestamp",
//     nullable: false,
//     default: () => "CURRENT_TIMESTAMP(6)",
//   })
//   createdAt: Date;

//   @UpdateDateColumn({
//     type: "timestamp",
//     default: () => "CURRENT_TIMESTAMP(6)",
//     onUpdate: "CURRENT_TIMESTAMP(6)",
//   })
//   updatedAt: Date;
// }
