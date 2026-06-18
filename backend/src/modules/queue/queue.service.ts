import { Injectable } from '@nestjs/common';
import { EngineService } from '../../engine/engine.service';
import { QueueMode } from '../../domain/types';

@Injectable()
export class QueueService {
  constructor(private readonly engine: EngineService) {}

  async build(mode: QueueMode = 'risk', now: Date = new Date()) {
    const rows = await this.engine.getQueue(mode, now);
    return { mode, total: rows.length, top: rows.slice(0, 3), rows };
  }
}
