import { HttpException, HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from 'src/components/maintenance/maintenance.service';
import { ERROR } from '../constants';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        let maintenance = await this.maintenanceService.findAll() as any;
        maintenance = maintenance[0];
        if (maintenance && maintenance?.immediateMaintenance) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: HttpStatus.BAD_REQUEST,
                success: false,
                data: {
                    isMaintained: true,
                },
                message: {
                    message: ERROR.MESSAGE_MAINTENANCE
                },
            });
        }

        next();
    }
}