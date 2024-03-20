import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import appConfig from 'src/system/config.system/app.config';
import { UserService } from 'src/components/user/user.service';
import { MaintenanceService } from 'src/components/maintenance/maintenance.service';
import { ERROR } from 'src/system/constants';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private maintenanceService: MaintenanceService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        let maintenance = await this.maintenanceService.findAll() as any;
        maintenance = maintenance[0];
        if (maintenance && maintenance?.immediateMaintenance) {
            throw new HttpException(
                {
                    message: 'websiteMaintaining',
                },
                HttpStatus.BAD_REQUEST,
            );
        }

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

            const u = await this.userService.getUserById(payload.sub);
            if (u.isBlocked) {
                throw new HttpException(
                    {
                        message: 'isBlocked',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

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
            } else if (error.message === 'isBlocked') {
                throw new HttpException(
                    {
                        message: 'UserIsBlocked',
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