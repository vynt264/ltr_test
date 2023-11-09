import { PartialType } from "@nestjs/swagger";
import { CreateConnectDto } from "./index";

export class UpdateConnectDto extends PartialType(CreateConnectDto) {}
