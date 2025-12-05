import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherLog, WeatherLogDocument } from './weather.schema';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @InjectModel(WeatherLog.name) private weatherModel: Model<WeatherLogDocument>,
  ) {}

  async create(data: any): Promise<WeatherLog> {
    this.logger.log(`💾 Salvando registro climático: ${data.temperature}°C`);
    const createdLog = new this.weatherModel(data);
    return createdLog.save();
  }

  async findAll(): Promise<WeatherLog[]> {
    return this.weatherModel.find().sort({ createdAt: -1 }).limit(100).exec();
  }
}
