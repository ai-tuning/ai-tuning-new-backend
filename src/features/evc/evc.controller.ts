import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EvcService } from './evc.service';
import { CreateEvcDto } from './dto/create-evc.dto';
import { UpdateEvcDto } from './dto/update-evc.dto';

@Controller('evc')
export class EvcController {
  constructor(private readonly evcService: EvcService) {}
}
