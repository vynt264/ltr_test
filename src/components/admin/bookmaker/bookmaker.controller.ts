import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BookmakerService } from './bookmaker.service';
import { CreateBookmakerDto } from './dto/create-bookmaker.dto';
import { UpdateBookmakerDto } from './dto/update-bookmaker.dto';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from 'src/components/auth/roles.guard/roles.decorator';
import { RIGHTS } from 'src/system/constants/rights';
import { ApiOperation } from '@nestjs/swagger';

@Controller('api/v1/admin-bookmaker')
@UseGuards(AuthAdminGuard, RolesGuard)
export class BookmakerController {
  constructor(private readonly bookmakerService: BookmakerService) {}

  @Post("create")
  @Roles(RIGHTS.CreateBookmarker)
  create(@Body() createBookmakerDto: CreateBookmakerDto, @Request() req: any) {
    return this.bookmakerService.create(createBookmakerDto, req.user);
  }

  @Get()
  @ApiOperation({
    description: "Get all bookmarkers to manage (crud)",
  })
  @Roles(RIGHTS.ShowListBookmarkers)
  getAll() {
    return this.bookmakerService.getAll();
  }

  @Get("all")
  @ApiOperation({
    description: "Get all bookmarkers to search",
  })
  findAll() {
    return this.bookmakerService.getAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookmakerService.getById(+id);
  }

  @Patch(':id')
  @Roles(RIGHTS.EditBookmarker)
  update(@Param('id') id: string, @Body() updateBookmakerDto: UpdateBookmakerDto, @Request() req: any) {
    return this.bookmakerService.update(+id, updateBookmakerDto, req.user);
  }

  @Delete(':id')
  @Roles(RIGHTS.DeleteBookmarker)
  remove(@Param('id') id: string) {
    return this.bookmakerService.delete(+id);
  }
}
