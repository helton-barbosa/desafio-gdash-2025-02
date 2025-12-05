import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherModule } from './weather/weather.module'; // Vamos criar já já

@Module({
  imports: [
    ConfigModule.forRoot(),

    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI || 'mongodb://admin:password123@mongodb:27017',
      }),
    }),

    WeatherModule,
  ],
})
export class AppModule {}
