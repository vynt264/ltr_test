import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { Between, Like, Repository } from "typeorm";
import { Logger } from "winston";
import { CreateBookMakerDto, UpdateBookMakerDto } from "./dto/index";
import { BookMaker } from "./bookmaker.entity";
@Injectable()
export class BookMakerService implements OnModuleInit {

  constructor(
    @InjectRepository(BookMaker)
    private bookMakerRepository: Repository<BookMaker>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async onModuleInit() {
    const bookmarkers = await this.getAllBookMaker();
    if (bookmarkers.length > 0) {

      // const promises = [];
      // for (let bookmarker of bookmarkers) {
      //   bookmarker = {
      //     ...bookmarker,
      //     isDeleted: false,
      //   };
      //   promises.push(
      //     this.bookMakerRepository.save(bookmarker)
      //   )
      // }

      // await Promise.all(promises);
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