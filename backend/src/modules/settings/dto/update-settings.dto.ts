import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Formula Studio: every alert threshold, risk weight, discount option and
 * target is tunable. Saved values immediately drive the calculation engine.
 */
export class UpdateSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(365) nearDeliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(365) criticalDeliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(365) checkWarningDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(365) debtWarningDays?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) riskOverdue?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) riskCritical?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) riskNear?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) riskBalance?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) riskContract?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) riskCheckCritical?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) riskDebtCritical?: number;

  @ApiPropertyOptional({ type: [Number], example: [0.07, 0.14, 0.16, 0.25] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(0.99, { each: true })
  discountOptions?: number[];

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) targetRevenue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) targetMaxCustomerBalance?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) targetMaxRiskScore?: number;
}
