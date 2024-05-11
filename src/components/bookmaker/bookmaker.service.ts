import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { BookMaker } from "./bookmaker.entity";
@Injectable()
export class BookMakerService implements OnModuleInit {
  constructor(
    @InjectRepository(BookMaker)
    private bookMakerRepository: Repository<BookMaker>,
  ) { }

  async onModuleInit() {
    const bookmarkers = await this.getAllBookMaker();
    if (bookmarkers.length > 0) {
      return;
    }

    await this.bookMakerRepository.save({
      name: 'default bookmaker',
    });
  }

  async getAllBookMaker(): Promise<any> {
    return await this.bookMakerRepository.find({
      select: {
        id: true
      },
      where: {
        isDeleted: false,
      }
    });
  }
}