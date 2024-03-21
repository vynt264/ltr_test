import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BookmakerService } from './bookmaker.service';
import { CreateBookmakerDto } from './dto/create-bookmaker.dto';
import { UpdateBookmakerDto } from './dto/update-bookmaker.dto';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';

@Controller('api/v1/admin-bookmaker')
@UseGuards(AuthAdminGuard)
export class BookmakerController {
  constructor(private readonly bookmakerService: BookmakerService) {}

  @Post("create")
  create(@Body() createBookmakerDto: CreateBookmakerDto, @Request() req: any) {
    return this.bookmakerService.create(createBookmakerDto, req.user);
  }

  @Get("all")
  findAll() {
    return this.bookmakerService.getAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookmakerService.getById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookmakerDto: UpdateBookmakerDto, @Request() req: any) {
    return this.bookmakerService.update(+id, updateBookmakerDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookmakerService.delete(+id);
  }
}
