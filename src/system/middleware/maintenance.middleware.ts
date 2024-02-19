import { HttpException, HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from 'src/components/maintenance/maintenance.service';
import { ERROR } from '../constants';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const maintenance = await this.maintenanceService.findAll() as any;
        if (maintenance && maintenance?.immediateMaintenance) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: HttpStatus.BAD_REQUEST,
                success: false,
                data: {
                    isMaintained: maintenance?.immediateMaintenance
                },
                message: {
                    message: ERROR.MESSAGE_MAINTENANCE
                },
            });
        }

        next();
    }
}