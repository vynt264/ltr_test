import { IsArray, IsNotEmpty } from "class-validator";
import { PaymentTransactionDto } from "./payment.dto";

export class ListPaymentTransDto {

  @IsNotEmpty()
  @IsArray()
  payments: PaymentTransactionDto[];
}
