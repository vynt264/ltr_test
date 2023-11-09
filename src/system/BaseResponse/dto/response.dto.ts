import { STATUSCODE } from "../../constants/statusCode";

export class BaseResponse {
  code: STATUSCODE | number;

  message: string;

  result: any;

  constructor(code: STATUSCODE | number, data?: any, message?: string) {
    this.code = code;
    this.message = message;
    this.result = data || null;
  }
}

export class ErrorResponse extends BaseResponse {}

export class SuccessResponse extends BaseResponse {}
