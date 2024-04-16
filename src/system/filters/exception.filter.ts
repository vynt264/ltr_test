import { Debug } from "../../common/helper/debug";
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Request, Response } from "express";
@Catch(HttpException)
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  getStatusSuccess(statusCode: number) {
    const statusSuccesses = [200, 201, 204, 205];
    return statusSuccesses.includes(statusCode);
  }

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionRes = exception.getResponse();

    this.handleMessage(exception);

    const message =
      Debug.typeOf(exception.message) === "String"
        ? exception.response
        : "The exception was unexpected!";
    const statusCode =
      exceptionRes.response?.statusCode ||
      exceptionRes.status ||
      exception.getStatus();

    const responseBody = {
      statusCode,
      success: this.getStatusSuccess(
        exceptionRes.response?.statusCode || exceptionRes.status
      ),
      data: "",
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(responseBody);
  }

  private handleMessage(exception: HttpException | Error): void {
    let message: any = 'Internal Server Error';
    if (exception instanceof HttpException) {
      message = exception.getResponse();
    } else if (exception instanceof Error) {
      message = exception.stack.toString();
    }
    // TODO: inject DI Logger
    // this.loggerService.error1(message)
  }
}
