import { S3 } from "aws-sdk";
import { Inject, Injectable } from "@nestjs/common";
import * as fs from "fs";
import { ConfigSys } from "src/common/helper";
@Injectable()
export class UploadS3Service {
  constructor() {};

  async uploadS3(file: Express.Multer.File, bucket: string) {
    const s3 = new S3({
      accessKeyId: ConfigSys.config().accessKeyId,
      secretAccessKey: ConfigSys.config().secretAccessKey,
      region: ConfigSys.config().region,
    });

    const randomName = new Date().getTime() + file?.originalname;
    const fileContent = fs.readFileSync(file.path);

    const params = {
      Bucket: bucket,
      Key: randomName,
      Body: fileContent,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const result = await s3.upload(params).promise();
    // Xoá file tạm thời trên server
    fs.unlinkSync(file.path);
    return { url: result.Location };
  }
}
