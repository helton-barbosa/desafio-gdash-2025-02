import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherModule } from './weather/weather.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ExternalModule } from './external/external.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri:
          process.env.MONGO_URI || 'mongodb://admin:password123@mongodb:27017',
      }),
    }),

    WeatherModule,
    UsersModule,
    AuthModule,
    ExternalModule,
  ],
})
export class AppModule {}
