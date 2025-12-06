import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherLog, WeatherLogDocument } from './weather.schema';
import { Parser } from 'json2csv';
import * as xlsx from 'xlsx';

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

  async generateInsights() {
    const logs = await this.weatherModel.find().sort({ createdAt: -1 }).limit(24).exec();

    if (logs.length === 0) return { message: "Dados insuficientes para análise." };

    // Cálculo de médias
    const avgTemp = logs.reduce((acc, curr) => acc + curr.temperature, 0) / logs.length;

    const avgHum = logs.reduce((acc, curr) => acc + curr.humidity, 0) / logs.length;
    const lastLog = logs[0];

    // Lógica "IA" baseada em regras (Rule-based AI System)
    const insights: string[] = [];

    // Análise de Temperatura
    if (avgTemp > 30) insights.push("🔥 Alerta de Calor Extremo: Média acima de 30°C nas últimas 24h.");
    else if (avgTemp < 15) insights.push("❄️ Frente Fria: Temperaturas baixas detectadas.");
    else insights.push("✅ Temperatura agradável e estável.");

    // Análise de Chuva (Códigos WMO: 51, 53, 55, 61, etc. indicam chuva)
    const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
    if (rainCodes.includes(lastLog.conditionCode)) {
      insights.push("☔ Chuva detectada no momento! Leve guarda-chuva.");
    }

    // Tendência
    const trend = logs[0].temperature > logs[logs.length-1].temperature ? "subindo" : "caindo";

    return {
      summary: `Baseado nos últimos ${logs.length} registros.`,
      average_temp: avgTemp.toFixed(1),
      average_humidity: avgHum.toFixed(1),
      trend: `A temperatura está ${trend} em relação ao início do período.`,
      alerts: insights,
    };
  }

  // --- NOVA FUNCIONALIDADE: EXPORT CSV ---
  async getCsv() {
    const logs = await this.findAll();
    const fields = ['createdAt', 'temperature', 'humidity', 'windSpeed', 'conditionCode'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(logs.map(log => ({
        createdAt: log['createdAt'], // Ajuste conforme seu objeto
        temperature: log.temperature,
        humidity: log.humidity,
        windSpeed: log.windSpeed,
        conditionCode: log.conditionCode
    })));
    return csv;
  }

  // --- NOVA FUNCIONALIDADE: EXPORT XLSX ---
  async getXlsx() {
    const logs = await this.findAll();
    // Prepara dados simples
    const data = logs.map(log => ({
      Data: log['createdAt'],
      Temp: log.temperature,
      Umidade: log.humidity,
      Vento: log.windSpeed
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Dados Climaticos');
    
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
