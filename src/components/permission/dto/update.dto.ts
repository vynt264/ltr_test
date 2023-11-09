import { PartialType } from "@nestjs/swagger";
import { CreatePermissionDto } from "./index";

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
