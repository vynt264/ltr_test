import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../admin.user/entities/admin.user.entity';
import { AdminUserModule } from '../admin.user/admin.user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AdminUser]),
        AdminUserModule,
    ],
})
export class GuardsModule { }
