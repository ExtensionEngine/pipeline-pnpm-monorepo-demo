import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

const API_TOKEN = 'abc123cd768DF99z';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log(API_TOKEN);
    return this.appService.getHello();
  }
}
