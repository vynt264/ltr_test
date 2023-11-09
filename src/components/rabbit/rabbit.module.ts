import { Module } from "@nestjs/common";
// import { RabbitmqController } from './rabbitmq.controller';

@Module({
  // imports: [
  //   ClientsModule.register([
  //     {
  //       name: "RABBITMQ_CLIENT",
  //       transport: Transport.RMQ,
  //       options: {
  //         urls: ["amqp://rabbitmq:5672"],
  //         queue: "nestjs_queue",
  //         queueOptions: {
  //           durable: true,
  //         },
  //       },
  //     },
  //   ]),
  // ],
  //   controllers: [RabbitmqController],
  //   providers: [RabbitmqService],
})
export class RabbitmqModule {}
