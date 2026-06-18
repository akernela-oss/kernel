import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './common/cache/cache.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { EngineModule } from './engine/engine.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinanceDefinitionsModule } from './modules/finance-definitions/finance-definitions.module';
import { HealthModule } from './modules/health/health.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { QueueModule } from './modules/queue/queue.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './resources/accounts/accounts.module';
import { ChecksModule } from './resources/checks/checks.module';
import { CustomersModule } from './resources/customers/customers.module';
import { DebtsModule } from './resources/debts/debts.module';
import { ExpensesModule } from './resources/expenses/expenses.module';
import { InvestmentsModule } from './resources/investments/investments.module';
import { MembersModule } from './resources/members/members.module';
import { SalesModule } from './resources/sales/sales.module';
import { TransactionsModule } from './resources/transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('logLevel') ?? 'info',
          transport:
            config.get<string>('nodeEnv') === 'production'
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          autoLogging: config.get<string>('nodeEnv') !== 'test',
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttlMs') ?? 60_000,
            limit: config.get<number>('throttle.limit') ?? 300,
          },
        ],
      }),
    }),
    PrismaModule,
    CacheModule,
    EngineModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    MembersModule,
    AccountsModule,
    SalesModule,
    TransactionsModule,
    ChecksModule,
    DebtsModule,
    InvestmentsModule,
    ExpensesModule,
    KpiModule,
    FinanceDefinitionsModule,
    DashboardModule,
    QueueModule,
    ReportsModule,
    SettingsModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    // Order matters: throttle first, then authenticate, then authorise.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    },
  ],
})
export class AppModule {}
