import { IsOptional } from "class-validator";
import { ValueDto } from "./request.value.dto";

export class BaoLoDto {

  @IsOptional()
  lo2So: ValueDto[];

  @IsOptional()
  lo2So1k: ValueDto[];

  @IsOptional()
  lo3So: ValueDto[];

  @IsOptional()
  lo4So: ValueDto[];
}
