import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../user/user.entity';
import { ListOrderRequestDto } from '../order.request/dto/create.list.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRequest } from '../order.request/order.request.entity';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { PaginationQueryDto } from 'src/common/common.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRequestRepository: Repository<Order>
  ) { }

  async create(orders: CreateOrderDto[], member: User) {
    let result: any;
    let promises = [];
    const turnIndex = "28/08/2023-0271";

    let count = 0;
    for (const order of orders) {
      count++;

      order.turnIndex = turnIndex;
      order.numericalOrder = count.toString();
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
    const [orders, total] = await this.orderRequestRepository.findAndCount({
      order: { id: order },
      take: perPage,
      skip: skip,
    });

    const lastPage = Math.ceil(total / perPage);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      data: orders,
      total,
      currentPage: page,
      nextPage,
      prevPage,
      lastPage,
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
}
