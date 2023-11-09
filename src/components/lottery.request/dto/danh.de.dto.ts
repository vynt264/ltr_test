import { IsOptional } from "class-validator";
import { ValueDto } from "./request.value.dto";

export class  DanhDeDto {

  @IsOptional()
  deDau: ValueDto[];

  @IsOptional()
  deDacBiet: ValueDto[];

  @IsOptional()
  deDauDuoi: ValueDto[];
}
