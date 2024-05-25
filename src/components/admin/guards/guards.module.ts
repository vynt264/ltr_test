import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../admin.user/entities/admin.user.entity';
import { AdminUserModule } from '../admin.user/admin.user.module';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AdminUser]),
        AdminUserModule,
        ValidateRightsModule,
    ],
})
export class GuardsModule { }
