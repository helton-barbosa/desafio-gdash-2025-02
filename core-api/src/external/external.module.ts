import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalService } from './external.service';
import { ExternalController } from './external.controller';

@Module({
  imports: [HttpModule],
  providers: [ExternalService],
  controllers: [ExternalController],
})
export class ExternalModule {}
