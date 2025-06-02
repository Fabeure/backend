import {
  Controller,
  Get,
  Post,
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

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('jsonlFile'))
  async uploadSession(
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
    
    // Validate that the content starts with #SESSION
    if (!content.trim().startsWith('#SESSION')) {
      throw new BadRequestException('Invalid JSONL file format. File must start with #SESSION');
    }

    return this.sessionsService.create(
      req.user.sub,
      content
    );
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.sessionsService.findAllByUserId(req.user.sub);
  }
} 