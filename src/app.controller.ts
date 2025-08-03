import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiOkResponse({ description: 'Hello message returned successfully' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  getHello(): string {
    return this.appService.getHello();
  }
}
