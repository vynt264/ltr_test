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

      const promises = [];
      for (let bookmarker of bookmarkers) {
        bookmarker = {
          ...bookmarker,
          isDeleted: false,
        };
        promises.push(
          this.bookMakerRepository.save(bookmarker)
        )
      }

      await Promise.all(promises);
      return;
    }

    await this.bookMakerRepository.save({
      name: 'default bookmaker',
    });
  }

  // async getAll(): Promise<any> {
  //   try {
  //     const listData = await this.bookMakerRepository.findAndCount({});
  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_SUCCESS,
  //       listData,
  //       MESSAGE.LIST_SUCCESS
  //     );
  //   } catch (error) {
  //     this.logger.debug(
  //       `${BookMakerService.name} is Logging error: ${JSON.stringify(error)}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       MESSAGE.LIST_FAILED
  //     );
  //   }
  // }

  async getAllBookMaker(): Promise<any> {
    return await this.bookMakerRepository.find({
      select: {
        id: true
      },
      // where: {
      //   isDeleted: false,
      // }
    });
  }

  // async getById(id: number): Promise<any> {
  //   try {
  //     const data = await this.bookMakerRepository.findOneBy({ id });
  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_SUCCESS,
  //       data,
  //       MESSAGE.LIST_SUCCESS
  //     );
  //   } catch (error) {
  //     this.logger.debug(
  //       `${BookMakerService.name} is Logging error: ${JSON.stringify(error)}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       MESSAGE.LIST_FAILED
  //     );
  //   }
  // }

  // async create(createDto: CreateBookMakerDto): Promise<any> {
  //   try {
  //     const createdBookMaker = await this.bookMakerRepository.create(createDto);
  //     const BookMaker = await this.bookMakerRepository.save(createdBookMaker);
  //     const { id } = BookMaker;
  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_CREATE_SUCCESS,
  //       { id },
  //       MESSAGE.CREATE_SUCCESS
  //     );
  //   } catch (error) {
  //     this.logger.debug(
  //       `${BookMakerService.name} is Logging error: ${JSON.stringify(error)}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       ERROR.CREATE_FAILED
  //     );
  //   }
  // }

  // async update(id: number, BookMakerDto: UpdateBookMakerDto, user: any): Promise<any> {
  //   try {
  //     let foundBookMaker = await this.bookMakerRepository.findOneBy({
  //       id,
  //     });

  //     if (!foundBookMaker) {
  //       return new ErrorResponse(
  //         STATUSCODE.COMMON_NOT_FOUND,
  //         `BookMaker with id: ${id} not found!`,
  //         ERROR.NOT_FOUND
  //       );
  //     }

  //     if (BookMakerDto) {
  //       foundBookMaker = {
  //         ...foundBookMaker,
  //         ...BookMakerDto,
  //         updatedBy: user?.name,
  //         updatedAt: new Date(),
  //       };
  //     }

  //     await this.bookMakerRepository.save(foundBookMaker);

  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_UPDATE_SUCCESS,
  //       "",
  //       MESSAGE.UPDATE_SUCCESS
  //     );
  //   } catch (error) {
  //     this.logger.debug(
  //       `${BookMakerService.name} is Logging error: ${JSON.stringify(error)}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       ERROR.UPDATE_FAILED
  //     );
  //   }
  // }

  // async delete(id: number): Promise<any> {
  //   try {
  //     const foundUser = await this.bookMakerRepository.findOneBy({
  //       id,
  //     });

  //     if (!foundUser) {
  //       return new ErrorResponse(
  //         STATUSCODE.COMMON_NOT_FOUND,
  //         `BookMaker with id: ${id} not found!`,
  //         ERROR.NOT_FOUND
  //       );
  //     }
  //     await this.bookMakerRepository.delete(id);

  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_DELETE_SUCCESS,
  //       `BookMaker has deleted id: ${id} success!`,
  //       MESSAGE.DELETE_SUCCESS
  //     );
  //   } catch (error) {
  //     this.logger.debug(
  //       `${BookMakerService.name} is Logging error: ${JSON.stringify(error)}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       ERROR.DELETE_FAILED
  //     );
  //   }
  // }
}