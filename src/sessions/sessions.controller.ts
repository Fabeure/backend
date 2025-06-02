import {
  Controller,
  Get,
  Post,
  ParseFilePipe,
  MaxFileSizeValidator,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async findAll() {
    return this.sessionsService.findAll();
  }
} 