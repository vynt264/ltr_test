import { Inject, OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FE_URL_1, FE_URL_2 } from 'src/system/config.system/config.default';
import { Logger } from 'winston';

@WebSocketGateway({
  cors: {
    origin: [FE_URL_1, FE_URL_2],
  },
})

export class SocketGatewayService implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject("winston")
    private readonly logger: Logger
) { }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      this.logger.info("socket connected.");
    });
  }

  sendEventToClient(event: string, data: any) {
    this.server.emit(event, data);
  }
}