import { PartialType } from '@nestjs/swagger';
import { CreateWalletHandlerDto } from './create-wallet-handler.dto';

export class UpdateWalletHandlerDto extends PartialType(CreateWalletHandlerDto) {}
