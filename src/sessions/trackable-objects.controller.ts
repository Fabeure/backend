import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('trackable-objects')
@UseGuards(JwtAuthGuard)
export class TrackableObjectsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('jsonFile'))
  async uploadTrackableObjects(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
        ],
      }),
    )
    file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const content = file.buffer.toString();
    
    return this.sessionsService.createTrackableObjects(
      req.user.sub,
      content
    );
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.sessionsService.getTrackableObjects(req.user.sub);
  }
} 