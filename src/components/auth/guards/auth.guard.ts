import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import appConfig from 'src/system/config.system/app.config';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: appConfig().atSecret
                }
            );

            const user = {
                id: payload.sub,
                name: payload.username,
                bookmakerId: payload?.bookmakerId || 1,
                usernameReal: payload?.usernameReal || '',
            }

            request['user'] = user;
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new HttpException(
                    {
                        message: 'TokenExpiredError',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            } else {
                throw new UnauthorizedException();
            }
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}