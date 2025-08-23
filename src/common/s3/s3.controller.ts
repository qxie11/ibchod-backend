import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { S3Service } from './s3.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('S3')
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const key = this.s3Service.generateFileKey(file.originalname, 'uploads');

    const fileUrl = await this.s3Service.uploadFile({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    return {
      message: 'File uploaded successfully',
      url: fileUrl,
      key,
    };
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete file from S3' })
  @ApiBearerAuth()
  async deleteFile(@Param('key') key: string) {
    await this.s3Service.deleteFile({ key });

    return {
      message: 'File deleted successfully',
      key,
    };
  }

  @Get('signed-url/:key')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get signed URL for file' })
  @ApiBearerAuth()
  async getSignedUrl(
    @Param('key') key: string,
    @Body('operation') operation: 'get' | 'put' = 'get',
    @Body('expiresIn') expiresIn?: number,
  ) {
    const signedUrl = await this.s3Service.getSignedUrl({
      key,
      operation,
      expiresIn,
    });

    return {
      signedUrl,
      key,
      operation,
      expiresIn: expiresIn || 3600,
    };
  }

  @Get('url/:key')
  @ApiOperation({ summary: 'Get public URL for file' })
  async getFileUrl(@Param('key') key: string) {
    const url = this.s3Service.getFileUrl(key);

    return {
      url,
      key,
    };
  }
}
