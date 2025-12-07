import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WeatherLogDocument = HydratedDocument<WeatherLog>;

@Schema({ timestamps: true })
export class WeatherLog {
  @Prop()
  city: string;

  @Prop({ type: Object })
  location: { lat: string; lon: string };

  @Prop()
  temperature: number;

  @Prop()
  feelsLike: number;

  @Prop()
  humidity: number;

  @Prop()
  windSpeed: number;

  @Prop()
  conditionCode: number;

  @Prop()
  isDay: number;

  @Prop()
  timestamp: string;

  // --- ADICIONADO PARA O TYPESCRIPT RECONHECER ---
  createdAt?: Date;
  updatedAt?: Date;
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);
