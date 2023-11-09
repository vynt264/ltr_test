import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreatePermissionDto, UpdatePermissionDto } from "./dto/index";
import { Permission } from "./permission.entity";
import {
  SuccessResponse,
  ErrorResponse,
} from "../../system/BaseResponse/index";
import { STATUSCODE, MESSAGE, ERROR } from "../../system/constants";

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) {}

  private readonly logger = new Logger(PermissionService.name);

  async getByName(role: string) {
    try {
      const foundPermission = await this.permissionRepository.findOneBy({
        role,
      });

      if (!foundPermission) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Permission with id: ${role} not found!`,
          ERROR.NOT_FOUND
        );
      }

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        foundPermission,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PermissionService.name} is Logging error: ${JSON.stringify(error)}`
      );

      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async getAll(): Promise<any> {
    try {
      const permissions = await this.permissionRepository.find({});

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        permissions,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PermissionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getOneById(id: number): Promise<any> {
    try {
      const permission = await this.permissionRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        permission,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PermissionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async create(permissionDto: CreatePermissionDto): Promise<any> {
    try {
      const createdPermission = await this.permissionRepository.create(
        permissionDto
      );
      await this.permissionRepository.save(createdPermission);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        createdPermission,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PermissionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, permissionDto: UpdatePermissionDto): Promise<any> {
    try {
      let foundPermission = await this.permissionRepository.findOneBy({
        id,
      });

      if (!foundPermission) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Permission with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundPermission = {
        ...foundPermission,
        ...permissionDto,
        updatedAt: new Date(),
      };
      await this.permissionRepository.save(foundPermission);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundPermission,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PermissionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async delete(id: number): Promise<any> {
    try {
      const foundPermission = await this.permissionRepository.findOneBy({
        id,
      });

      if (!foundPermission) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Permission with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.permissionRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Permission has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PermissionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}
