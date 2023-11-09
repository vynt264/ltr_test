import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1679631919961 implements MigrationInterface {
  name = "Migration1679631919961";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET time_zone = 'Asia/Ho_Chi_Minh'`);
    // await queryRunner.query(`CREATE TABLE \`backlist\` (\`id\` int NOT NULL AUTO_INCREMENT, \`acToken\` varchar(255) NOT NULL, \`userId\` int NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ef74a0b48306e4fbb2dd7b24be\` (\`acToken\`), UNIQUE INDEX \`IDX_39aa81a3f967f496aea4e640dd\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`devices\` (\`id\` int NOT NULL AUTO_INCREMENT, \`mac\` varchar(100) NOT NULL, \`ip\` varchar(100) NOT NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`examples\` (\`id\` int NOT NULL AUTO_INCREMENT, \`count\` int NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`permissions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`role\` varchar(255) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ca5274dd57401e6b4b24ff5b15\` (\`role\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NULL, \`email\` varchar(255) NULL, \`username\` varchar(255) NOT NULL, \`password\` varchar(255) NULL, \`hashedRt\` varchar(255) NULL, \`role\` enum ('admin', 'member', 'supper', 'leader') NOT NULL DEFAULT 'member', \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`user-history\` (\`id\` int NOT NULL AUTO_INCREMENT, \`count\` int NOT NULL DEFAULT '1', \`action\` varchar(50) NOT NULL, \`note\` varchar(200) NOT NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deviceId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`event-times\` (\`id\` int NOT NULL AUTO_INCREMENT, \`start\` timestamp NOT NULL, \`end\` timestamp NOT NULL, \`department\` varchar(50) NOT NULL, \`gameName\` varchar(100) NOT NULL, \`amount\` smallint NOT NULL DEFAULT '1', \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`apis\` (\`id\` int NOT NULL AUTO_INCREMENT, \`api\` varchar(255) NOT NULL, \`action\` varchar(255) NOT NULL, \`department\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`api_UNIQUE\` (\`api\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`cron-job\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` int NOT NULL, \`action\` varchar(50) NOT NULL, \`description\` text NOT NULL, \`summary\` text NOT NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`deposits\` (\`id\` int NOT NULL AUTO_INCREMENT, \`level\` varchar(50) NOT NULL, \`totalRechargeAmount\` decimal(10,3) NOT NULL DEFAULT '0.000', \`totalValidBetAmount\` decimal(10,3) NOT NULL DEFAULT '0.000', \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`onboard\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`gameTypeId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`game-types\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(30) NOT NULL DEFAULT 0, \`type\` smallint NOT NULL DEFAULT '0', \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`game_UNIQUE\` (\`name\`, \`type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    // await queryRunner.query(`CREATE TABLE \`collections\` (\`id\` int NOT NULL AUTO_INCREMENT, \`money\` decimal(10,3) NOT NULL DEFAULT '0.000', \`type\` varchar(100) NOT NULL, \`typeName\` varchar(100) NOT NULL, \`onboard\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`collections\``);
    await queryRunner.query(`DROP INDEX \`game_UNIQUE\` ON \`game-types\``);
    await queryRunner.query(`DROP TABLE \`game-types\``);
    await queryRunner.query(`DROP TABLE \`deposits\``);
    await queryRunner.query(`DROP TABLE \`cron-job\``);
    await queryRunner.query(`DROP INDEX \`api_UNIQUE\` ON \`apis\``);
    await queryRunner.query(`DROP TABLE \`apis\``);
    await queryRunner.query(`DROP TABLE \`event-times\``);
    await queryRunner.query(`DROP TABLE \`user-history\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ca5274dd57401e6b4b24ff5b15\` ON \`permissions\``
    );
    await queryRunner.query(`DROP TABLE \`permissions\``);
    await queryRunner.query(`DROP TABLE \`examples\``);
    await queryRunner.query(`DROP TABLE \`devices\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_39aa81a3f967f496aea4e640dd\` ON \`backlist\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ef74a0b48306e4fbb2dd7b24be\` ON \`backlist\``
    );
    await queryRunner.query(`DROP TABLE \`backlist\``);
  }
}
