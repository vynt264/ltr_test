import { Injectable } from "@nestjs/common";
import { Backlist } from "./backlist.entity";
import { LessThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class BacklistService {
  constructor(
    @InjectRepository(Backlist)
    private backlistRepository: Repository<Backlist>
  ) {}

  async getByUserId(userId: number) {
    return this.backlistRepository.find({
      where: {
        userId,
        status: 1,
      },
    });
  }

  async getOneByToken(userId: number, acToken: string) {
    return this.backlistRepository.findOneBy({
      userId,
      acToken,
      status: 0,
    });
  }

  async create(...data: any): Promise<void> {
    const firstItem = data.find((x: any) => x !== undefined);
    const createdBacklist = await this.backlistRepository.create(firstItem);
    await this.backlistRepository.save(createdBacklist);
  }

  async update(...data: any): Promise<void> {
    const firstItem = data.find((x: any) => x !== undefined);
    const { userId, acToken } = firstItem;
    let foundBacklist = await this.backlistRepository.findOneBy({
      userId,
      acToken,
      status: 1,
    });

    if (foundBacklist) {
      foundBacklist = {
        ...foundBacklist,
        ...firstItem,
        updatedAt: new Date(),
      };

      await this.backlistRepository.save(foundBacklist);
    }
  }

  async deleteBacklist() {
    const currentDate = new Date();
    const timeCheck = new Date(currentDate);
    timeCheck.setHours(currentDate.getHours() - 2);
    // delete lotery request
    const data = await this.backlistRepository.find({
      where: {
        createdAt: LessThan(timeCheck)
      }
    });
    if (data?.length > 0) {
      data.map(async (item) => {
        await this.backlistRepository.delete(item?.id)
      })
    }
  }
}
