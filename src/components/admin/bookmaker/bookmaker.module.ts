import { Module } from '@nestjs/common';
import { BookmakerService } from './bookmaker.service';
import { BookmakerController } from './bookmaker.controller';
import { Bookmaker } from './entities/bookmaker.entity';
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bookmaker]),
    JwtModule.register({}),
  ],
  controllers: [BookmakerController],
  providers: [BookmakerService],
  exports: [BookmakerService]
})
export class BookmakerModule {}
