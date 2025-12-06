import { Controller, Post, Get, Body, Res, UseGuards } from '@nestjs/common';
import { WeatherService } from './weather.service';
import type { Response } from 'express';

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

  @Get('insights')
  async getInsights() {
    return this.weatherService.generateInsights();
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.weatherService.getCsv();
    res.header('Content-Type', 'text/csv');
    res.attachment('weather_data.csv');
    return res.send(csv);
  }

  @Get('export/xlsx')
  async exportXlsx(@Res() res: Response) {
    const buffer = await this.weatherService.getXlsx();
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('weather_data.xlsx');
    return res.send(buffer);
  }
}
