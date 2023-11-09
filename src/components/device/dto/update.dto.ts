import { PartialType } from "@nestjs/swagger";
import { CreateDeviceDto } from "./index";

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}
