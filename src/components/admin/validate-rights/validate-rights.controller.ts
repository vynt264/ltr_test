import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ValidateRightsService } from './validate-rights.service';
import { CreateValidateRightDto } from './dto/create-validate-right.dto';
import { UpdateValidateRightDto } from './dto/update-validate-right.dto';

@Controller('validate-rights')
export class ValidateRightsController {
}
