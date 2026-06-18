import { Injectable } from '@nestjs/common';
import { EngineService } from '../../engine/engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: EngineService,
  ) {}

  get() {
    return this.engine.getSettingsAndFormulas();
  }

  async update(dto: UpdateSettingsDto) {
    await this.prisma.appSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...dto },
      update: { ...dto },
    });
    this.engine.invalidate();
    return this.get();
  }
}
