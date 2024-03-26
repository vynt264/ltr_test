import { Injectable } from '@nestjs/common';
import { CreateBookmakerDto } from './dto/create-bookmaker.dto';
import { UpdateBookmakerDto } from './dto/update-bookmaker.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Bookmaker } from './entities/bookmaker.entity';
import { Repository } from 'typeorm';
import { ErrorResponse, SuccessResponse } from 'src/system/BaseResponse';
import { ERROR, MESSAGE, STATUSCODE } from 'src/system/constants';

@Injectable()
export class BookmakerService {
  constructor(
    @InjectRepository(Bookmaker)
    private bookMakerRepository: Repository<Bookmaker>,
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.bookMakerRepository.findAndCount({
        where: {
          isDeleted: false,
        },
      });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getById(id: number): Promise<any> {
    try {
      const data = await this.bookMakerRepository.findOneBy({ id });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        data,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreateBookmakerDto, user: any): Promise<any> {
    try {
      const data = {
        ...createDto,
        updatedBy: user?.name,
      };
      const createdBookMaker = await this.bookMakerRepository.create(data);
      const BookMaker = await this.bookMakerRepository.save(createdBookMaker);
      const { id } = BookMaker;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, BookMakerDto: UpdateBookmakerDto, user: any): Promise<any> {
    try {
      let foundBookMaker = await this.bookMakerRepository.findOneBy({
        id,
      });

      if (!foundBookMaker) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `BookMaker with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (BookMakerDto) {
        foundBookMaker = {
          ...foundBookMaker,
          ...BookMakerDto,
          updatedBy: user?.name,
          updatedAt: new Date(),
        };
      }

      await this.bookMakerRepository.save(foundBookMaker);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async delete(id: number): Promise<any> {
    try {
      let foundUser = await this.bookMakerRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `BookMaker with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundUser = {
        ...foundUser,
        isDeleted: true,
      };

      await this.bookMakerRepository.save(foundUser);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `BookMaker has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} bookmaker`;
  }
}
