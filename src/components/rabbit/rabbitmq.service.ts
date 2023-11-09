import { Injectable, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Observable } from "rxjs";

@Injectable()
export class RabbitmqService {
  constructor(
    @Inject("RABBITMQ_CLIENT") private readonly client: ClientProxy
  ) {}

  send(message: any): Observable<any> {
    try {
      const result = this.client.send("nestjs_queue", message);
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}
