import { PartialType } from "@nestjs/swagger";
import { CreateUserInfoDto } from "./index";

export class UpdateUserInfoDto extends PartialType(CreateUserInfoDto) {}
