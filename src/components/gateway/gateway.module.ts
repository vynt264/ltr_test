import { Module } from '@nestjs/common';
import { SocketGatewayService } from './gateway.service';

@Module({
    providers: [SocketGatewayService],
    exports: [GatewayModule, SocketGatewayService],
})
export class GatewayModule {}
