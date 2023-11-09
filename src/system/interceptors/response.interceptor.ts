import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
  success: boolean;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    return next.handle().pipe(
      map((data) => ({
        data,
        success: this.getStatusSuccess(ctx),
        statusCode: ctx.getResponse().statusCode,
        message: "success",
      }))
    );
  }

  getStatusSuccess(ctx: HttpArgumentsHost) {
    const statusSuccesses = [200, 201, 204, 205];
    const statusCode = ctx.getResponse().statusCode;
    return statusSuccesses.includes(statusCode);
  }
}
