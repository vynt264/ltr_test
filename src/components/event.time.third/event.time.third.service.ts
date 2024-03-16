// import { Injectable, Logger } from "@nestjs/common";
// import { InjectRepository } from "@nestjs/typeorm";
// import { Repository } from "typeorm";
// import { CreateEventTimeDto, UpdateEventTimeDto } from "./dto/index";
// import { EventTime } from "./event.time.third.entity";
// import {
//   SuccessResponse,
//   ErrorResponse,
// } from "../../system/BaseResponse/index";
// import { STATUSCODE, MESSAGE, ERROR } from "../../system/constants";
// import { PaginationQueryDto } from "../../common/common.dto";
// import { UpdateEventTimeIsLockDto } from "./dto/updateIsLock.dto";

// @Injectable()
// export class EventTimeService {
//   constructor(
//     @InjectRepository(EventTime)
//     private eventTimeRepository: Repository<EventTime>
//   ) {}

//   private readonly logger = new Logger(EventTimeService.name);

//   async getAll(paginationQueryDto: PaginationQueryDto): Promise<any> {
//     const { take: perPage, skip: page, order } = paginationQueryDto;
//     if (page <= 0) {
//       return "The skip must be more than 0";
//     }
//     const skip = +perPage * +page - +perPage;
//     try {
//       const eventTimes = await this.eventTimeRepository.findAndCount({
//         select: {
//           id: true,
//           start: true,
//           end: true,
//           isDeleted: true,
//           isLock: true,
//           department: true,
//           gameName: true,
//         },
//         order: { id: order },
//         take: +perPage,
//         skip,
//       });

//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         eventTimes,
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${EventTimeService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         MESSAGE.LIST_FAILED
//       );
//     }
//   }

//   async getOneById(id: number): Promise<any> {
//     try {
//       const eventTime = await this.eventTimeRepository.findOneBy({ id });

//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         eventTime,
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${EventTimeService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_NOT_FOUND,
//         error,
//         ERROR.NOT_FOUND
//       );
//     }
//   }

//   async create(eventTimeDto: CreateEventTimeDto): Promise<any> {
//     try {
//       const createdEventTime = await this.eventTimeRepository.create(
//         eventTimeDto
//       );
//       await this.eventTimeRepository.save(createdEventTime);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_CREATE_SUCCESS,
//         createdEventTime,
//         MESSAGE.CREATE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${EventTimeService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.CREATE_FAILED
//       );
//     }
//   }

//   async update(id: number, eventTimeDto: UpdateEventTimeDto): Promise<any> {
//     try {
//       let foundEventTime = await this.eventTimeRepository.findOneBy({
//         id,
//       });

//       if (!foundEventTime) {
//         return new ErrorResponse(
//           STATUSCODE.COMMON_NOT_FOUND,
//           `EventTime with id: ${id} not found!`,
//           ERROR.NOT_FOUND
//         );
//       }

//       foundEventTime = {
//         ...foundEventTime,
//         ...eventTimeDto,
//         updatedAt: new Date(),
//       };
//       await this.eventTimeRepository.save(foundEventTime);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_UPDATE_SUCCESS,
//         foundEventTime,
//         MESSAGE.UPDATE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${EventTimeService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.UPDATE_FAILED
//       );
//     }
//   }

//   async delete(id: number): Promise<any> {
//     try {
//       const foundEventTime = await this.eventTimeRepository.findOneBy({
//         id,
//       });

//       if (!foundEventTime) {
//         return new ErrorResponse(
//           STATUSCODE.COMMON_NOT_FOUND,
//           `EventTime with id: ${id} not found!`,
//           ERROR.NOT_FOUND
//         );
//       }
//       await this.eventTimeRepository.delete(id);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_DELETE_SUCCESS,
//         `EventTime has deleted id: ${id} success!`,
//         MESSAGE.DELETE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${EventTimeService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.DELETE_FAILED
//       );
//     }
//   }

//   async updateIsLock(
//     id: number,
//     eventTimeDto: UpdateEventTimeIsLockDto
//   ): Promise<any> {
//     try {
//       let foundEventTime = await this.eventTimeRepository.findOneBy({
//         id,
//       });

//       if (!foundEventTime) {
//         return new ErrorResponse(
//           STATUSCODE.COMMON_NOT_FOUND,
//           `EventTime with id: ${id} not found!`,
//           ERROR.NOT_FOUND
//         );
//       }

//       foundEventTime = {
//         ...foundEventTime,
//         ...eventTimeDto,
//         updatedAt: new Date(),
//       };
//       await this.eventTimeRepository.save(foundEventTime);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_UPDATE_SUCCESS,
//         foundEventTime,
//         MESSAGE.UPDATE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${EventTimeService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.UPDATE_FAILED
//       );
//     }
//   }
// }
