import { Controller, Post, Get, Body } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather') // Rota final: /api/weather
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  // POST /api/weather/logs
  @Post('logs')
  async createLog(@Body() data: any) {
    return this.weatherService.create(data);
  }

  // GET /api/weather/logs
  @Get('logs')
  async getLogs() {
    return this.weatherService.findAll();
  }
}
