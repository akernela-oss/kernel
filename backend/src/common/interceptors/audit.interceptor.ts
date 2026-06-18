import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthUser } from '../decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Records every state-changing request (who, what, when, outcome) into the
 * audit_logs table. Writes are fire-and-forget so auditing never slows down or
 * breaks the request it is observing.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const method = req.method;

    if (!MUTATING.has(method)) {
      return next.handle();
    }

    const started = Date.now();
    const user = req.user;
    const path = req.originalUrl || req.url;
    const entity = this.extractEntity(path);
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (body) => {
          const res = context.switchToHttp().getResponse<Response>();
          void this.write({
            user,
            method,
            path,
            entity,
            entityId: this.extractId(req, body),
            statusCode: res.statusCode,
            durationMs: Date.now() - started,
            ip,
            userAgent,
          });
        },
        error: (err: { status?: number }) => {
          void this.write({
            user,
            method,
            path,
            entity,
            entityId: this.extractId(req),
            statusCode: err?.status ?? 500,
            durationMs: Date.now() - started,
            ip,
            userAgent,
          });
        },
      }),
    );
  }

  private async write(data: {
    user?: AuthUser;
    method: string;
    path: string;
    entity: string | null;
    entityId: string | null;
    statusCode: number;
    durationMs: number;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.user?.id ?? null,
          username: data.user?.username ?? null,
          role: data.user?.role ?? null,
          action: `${data.method} ${data.entity ?? ''}`.trim(),
          method: data.method,
          path: data.path,
          entity: data.entity,
          entityId: data.entityId,
          statusCode: data.statusCode,
          durationMs: data.durationMs,
          ip: data.ip ?? null,
          userAgent: data.userAgent ?? null,
        },
      });
    } catch {
      // Never let auditing failures affect the request lifecycle.
    }
  }

  private extractEntity(path: string): string | null {
    const cleaned = path.split('?')[0];
    const parts = cleaned.split('/').filter(Boolean);
    const apiIdx = parts.indexOf('api');
    const idx = apiIdx >= 0 ? apiIdx + 1 : 0;
    // skip version segment like v1 if present
    const segment = parts[idx] === 'v1' ? parts[idx + 1] : parts[idx];
    return segment ?? null;
  }

  private extractId(req: Request, body?: unknown): string | null {
    const params = req.params as Record<string, string>;
    if (params?.id) return params.id;
    if (body && typeof body === 'object' && 'id' in body) {
      return String((body as { id: unknown }).id);
    }
    return null;
  }
}
