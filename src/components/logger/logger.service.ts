import { LoggerService } from '@nestjs/common';
import { Injectable, Scope } from '@nestjs/common';
import { Logger } from 'winston';
// import { Logger } from 'src/system/middleware/logger';

@Injectable()
export class LoggerService1 extends Logger {
    // constructor() {
    //     super();
    // }

    error1(message: any, trace?: string, context?: string) {
        this.error(message, trace, context)
    }

    // warn1(message: any, context?: string) {
    //     super.warn(message, context)
    // }

    // log1(message: any, context?: string) {
    //     super.log(message, context)
    // }

    // debug1(message: any, context?: string) {
    //     super.debug(message, context)
    // }
}
