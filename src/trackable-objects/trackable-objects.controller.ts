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
import { TrackableObjectsService } from './trackable-objects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('trackable-objects')
@UseGuards(JwtAuthGuard)
export class TrackableObjectsController {
  constructor(private readonly trackableObjectsService: TrackableObjectsService) {}

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
    
    return this.trackableObjectsService.create(
      req.user.sub,
      content
    );
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.trackableObjectsService.findAllByUserId(req.user.sub);
  }
} 