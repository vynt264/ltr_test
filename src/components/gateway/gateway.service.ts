import { OnModuleInit } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FE_URL_1, FE_URL_2 } from 'src/system/config.system/config.default';

@WebSocketGateway({
  cors: {
    origin: [FE_URL_1, FE_URL_2],
  },
})

export class SocketGatewayService implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('socket connected');
    });
  }

  sendEventToClient(event: string, data: any) {
    this.server.emit(event, data);
  }
}