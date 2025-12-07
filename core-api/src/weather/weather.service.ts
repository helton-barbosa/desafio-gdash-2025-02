import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Parser } from 'json2csv';
import * as xlsx from 'xlsx';
import { WeatherLog, WeatherLogDocument } from './weather.schema';
import { CreateWeatherDto } from './create-weather.dto';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @InjectModel(WeatherLog.name)
    private weatherModel: Model<WeatherLogDocument>,
  ) {}

  async create(data: CreateWeatherDto): Promise<WeatherLog> {
    this.logger.log(
      `💾 Clima: ${data.city || 'Local'} | ${data.temperature}°C`,
    );
    const createdLog = new this.weatherModel(data);
    return createdLog.save();
  }

  async findAll(): Promise<WeatherLog[]> {
    return this.weatherModel.find().sort({ createdAt: -1 }).limit(100).exec();
  }

  async generateInsights() {
    const logs = await this.weatherModel
      .find()
      .sort({ createdAt: -1 })
      .limit(24)
      .exec();

    if (logs.length === 0) {
      return {
        summary: 'Aguardando dados suficientes para análise...',
        alerts: [],
      };
    }

    const current = logs[0];
    const avgTemp =
      logs.reduce((acc, curr) => acc + curr.temperature, 0) / logs.length;
    const avgHum =
      logs.reduce((acc, curr) => acc + curr.humidity, 0) / logs.length;

    const insights: string[] = [];

    if (current.temperature > 32) {
      insights.push('🔥 Calor intenso! Hidrate-se e evite sol direto.');
    } else if (current.temperature < 15) {
      insights.push('❄️ Temperaturas baixas. Recomenda-se agasalho.');
    }

    if (current.feelsLike && current.temperature - current.feelsLike > 2) {
      insights.push(
        '💨 O vento está fazendo a sensação térmica cair. Proteja-se do vento.',
      );
    }

    const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
    if (rainCodes.includes(current.conditionCode)) {
      insights.push('☔ Está chovendo. Atenção para pistas molhadas.');
    } else if (current.humidity > 85) {
      insights.push(
        '💧 Umidade muito alta. Sensação de abafamento ou risco de chuva.',
      );
    } else if (current.humidity < 30) {
      insights.push('🌵 Ar muito seco! Risco de irritação respiratória.');
    }

    const startTemp = logs[logs.length - 1].temperature;
    const endTemp = current.temperature;
    let trendText = 'estável';

    if (endTemp > startTemp + 2) trendText = 'em rápida elevação';
    if (endTemp < startTemp - 2) trendText = 'caindo rapidamente';

    return {
      summary: `Análise baseada nos últimos ${logs.length} registros em ${current.city || 'sua região'}.`,
      average_temp: avgTemp.toFixed(1),
      average_humidity: avgHum.toFixed(1),
      trend: `A temperatura está ${trendText} nas últimas horas.`,
      alerts:
        insights.length > 0
          ? insights
          : ['✅ Condições climáticas estáveis e agradáveis.'],
    };
  }

  async getCsv(): Promise<string> {
    const logs = await this.findAll();
    const fields = [
      'createdAt',
      'city',
      'temperature',
      'feelsLike',
      'humidity',
      'windSpeed',
      'conditionCode',
    ];
    const opts = { fields };

    const parser: Parser<any> = new Parser(opts);

    const data: any[] = logs.map((log) => ({
      createdAt: log.createdAt,
      city: log.city,
      temperature: log.temperature,
      feelsLike: log.feelsLike,
      humidity: log.humidity,
      windSpeed: log.windSpeed,
      conditionCode: log.conditionCode,
    }));

    return parser.parse(data);
  }

  async getXlsx(): Promise<Buffer> {
    const logs = await this.findAll();

    const data: any[] = logs.map((log) => ({
      Data: log.createdAt,
      Cidade: log.city,
      Temp: log.temperature,
      Sensacao: log.feelsLike,
      Umidade: log.humidity,
      Vento: log.windSpeed,
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Dados');

    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
