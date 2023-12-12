import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { UploadMiddleware } from "src/system/middleware/upload.middleware";
import { UploadS3Service } from "./upload.s3.service";

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: UploadMiddleware,
    }),
  ],
  providers: [UploadS3Service],
  exports: [UploadS3Module, UploadS3Service],
})
export class UploadS3Module {}
