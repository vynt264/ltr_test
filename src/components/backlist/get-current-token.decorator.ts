import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetCurrentToken = createParamDecorator(
  (_: undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const acToken = request?.get("authorization")?.replace("Bearer", "").trim();

    return acToken;
  }
);
