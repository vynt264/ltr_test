import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) { }

  async onModuleInit() {
    // create defaul role Super
    const role = await this.roleRepository.findOne({
      where: {
        name: "Super",
      },
    });

    if (role) return;

    await this.roleRepository.save({
      name: "Super",
      permissions: "super",
    });
  }

  create(createRoleDto: CreateRoleDto) {
    return this.roleRepository.save(createRoleDto);
  }

  async findAll({
    page,
    limit,
  }: any) {
    limit = Number(limit || 10);
    page = Number(page || 1);

    const [roles, total] = await this.roleRepository.findAndCount({
      where: {
        isDeleted: false,
        name: Not('Super'),
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      roles,
      prevPage,
      nextPage,
      lastPage,
      total,
    };
  }

  findOne(id: number) {
    return this.roleRepository.findOne({
      where: {
        id,
      },
    });
  }

  findRoleByName(name: string) {
    return this.roleRepository.findOne({
      where: {
        name,
      },
    });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.roleRepository.update(id, updateRoleDto);
  }

  remove(id: number) {
    return this.roleRepository.update(id, { isDeleted: true });
  }
}
