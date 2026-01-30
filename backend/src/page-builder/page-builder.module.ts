import { Module } from '@nestjs/common';
import { PageBuilderController } from './page-builder.controller';
import { PageBuilderService } from './page-builder.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PageBuilderController],
  providers: [PageBuilderService],
  exports: [PageBuilderService],
})
export class PageBuilderModule {}
