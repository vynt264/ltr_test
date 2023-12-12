import { Injectable } from "@nestjs/common";
import {
  MulterOptionsFactory,
  MulterModuleOptions,
} from "@nestjs/platform-express/multer";
import { diskStorage } from "multer";
import { extname } from "path";

@Injectable()
export class UploadMiddleware implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, callback) => {
          const randomName = new Date().getTime() + extname(file.originalname);
          callback(null, randomName);
        },
      }),
    };
  }
}
