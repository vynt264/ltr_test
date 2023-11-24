import { Injectable } from '@nestjs/common';
import { endOfDay, startOfDay } from "date-fns";

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../user/user.entity';
import { ListOrderRequestDto } from '../order.request/dto/create.list.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRequest } from '../order.request/order.request.entity';
import { Between, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { PaginationQueryDto } from 'src/common/common.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateListOrdersDto } from './dto/create-list-orders.dto';
import { BaCangType, BaoLoType, BetTypeName, BonCangType, CategoryLotteryType, CategoryLotteryTypeName, DanhDeType, DauDuoiType, LoTruocType, LoXienType } from 'src/system/enums/lotteries';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRequestRepository: Repository<Order>
  ) { }

  async create(data: CreateListOrdersDto, member: User) {
    let result: any;
    let promises = [];
    const turnIndex = "28/08/2023-0271";

    let count = 0;
    for (const order of data.orders) {
      count++;

      order.turnIndex = turnIndex;
      order.numericalOrder = count.toString();
      order.betTypeName = this.getCategoryLotteryTypeName(order.betType);
      order.childBetTypeName = this.getBetTypeName(order.childBetType);
      order.numberOfBets = 100;

      promises.push(this.orderRequestRepository.save(order));

      if (promises.length === 1000) {
        const tempResult = await Promise.all(promises);
        result = result.concat(tempResult);
        promises = [];
      }
    }

    if (promises.length === 0) return;

    result = await Promise.all(promises);

    return result;
  }

  async findAll(paginationDto: PaginationQueryDto) {
    let { take: perPage, skip: page, order } = paginationDto;

    if (!perPage || perPage <= 0) {
      perPage = 10
    }

    page = Number(page) || 1;

    if (!page || page <= 0) {
      page = 1;
    }
    const skip = +perPage * +page - +perPage;

    const fromDate = startOfDay(new Date(paginationDto.date))
    const toDate = endOfDay(new Date(paginationDto.date));
    const condition: any = {};

    if (paginationDto.status) {
      condition.status = paginationDto.status;
    }

    if (paginationDto.date) {
      condition.createdAt = Between(fromDate, toDate);
    }

    const [orders, total] = await this.orderRequestRepository.findAndCount({
      where: condition,
      order: { id: order },
      take: perPage,
      skip: skip,
    });

    const lastPage = Math.ceil(total / perPage);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      total,
      nextPage,
      prevPage,
      lastPage,
      data: orders,
      currentPage: page,
    }
  }

  async findOne(id: number) {
    return this.orderRequestRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: number, updateOrderDto: any) {
    return this.orderRequestRepository.update(id, updateOrderDto);
  }

  remove(id: number) {
    return this.orderRequestRepository.delete(id);
  }

  getCategoryLotteryTypeName(type: String) {

    let typeName = '';
    switch (type) {
      case CategoryLotteryType.BaoLo:
        typeName = CategoryLotteryTypeName.BaoLo;
        break;

      case CategoryLotteryType.LoXien:
        typeName = CategoryLotteryTypeName.LoXien;
        break;

      case CategoryLotteryType.DanhDe:
        typeName = CategoryLotteryTypeName.DanhDe;
        break;

      case CategoryLotteryType.DauDuoi:
        typeName = CategoryLotteryTypeName.DauDuoi;
        break;

      case CategoryLotteryType.Lo3Cang:
        typeName = CategoryLotteryTypeName.Lo3Cang;
        break;

      case CategoryLotteryType.Lo4Cang:
        typeName = CategoryLotteryTypeName.Lo4Cang;
        break;

      case CategoryLotteryType.LoTruot:
        typeName = CategoryLotteryTypeName.LoTruot;
        break;

      case CategoryLotteryType.TroChoiThuVi:
        typeName = CategoryLotteryTypeName.TroChoiThuVi;
        break;

      default:
        break;
    }

    return typeName;
  }

  getBetTypeName(type: String) {

    let typeName = '';
    switch (type) {
      case BaoLoType.Lo2So:
        typeName = BetTypeName.Lo2So;
        break;

      case BaoLoType.Lo2So1k:
        typeName = BetTypeName.Lo2So1k;
        break;

      case BaoLoType.Lo3So:
        typeName = BetTypeName.Lo3So;
        break;

      case BaoLoType.Lo4So:
        typeName = BetTypeName.Lo4So;
        break;

      case LoXienType.Xien2:
        typeName = BetTypeName.Xien2;
        break;

      case LoXienType.Xien3:
        typeName = BetTypeName.Xien3;
        break;

      case LoXienType.Xien4:
        typeName = BetTypeName.Xien4;
        break;

      case DanhDeType.DeDau:
        typeName = BetTypeName.DeDau;
        break;

      case DanhDeType.DeDacBiet:
        typeName = BetTypeName.DeDacBiet;
        break;

      case DanhDeType.DeDauDuoi:
        typeName = BetTypeName.DeDauDuoi;
        break;

      case DauDuoiType.Dau:
        typeName = BetTypeName.Dau;
        break;

      case DauDuoiType.Duoi:
        typeName = BetTypeName.Duoi;
        break;

      case BaCangType.BaCangDau:
        typeName = BetTypeName.BaCangDau;
        break;

      case BaCangType.BaCangDacBiet:
        typeName = BetTypeName.BaCangDacBiet;
        break;

      case BaCangType.BaCangDauDuoi:
        typeName = BetTypeName.BaCangDauDuoi;
        break;

      case BonCangType.BonCangDacBiet:
        typeName = BetTypeName.BonCangDacBiet;
        break;

      case LoTruocType.TruotXien4:
        typeName = BetTypeName.TruotXien4;
        break;

      case LoTruocType.TruotXien8:
        typeName = BetTypeName.TruotXien8;
        break;
      case LoTruocType.TruotXien10:
        typeName = BetTypeName.TruotXien10;
        break;

      default:
        break;
    }

    return typeName;
  }
}
