import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EditBotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public welcomeMessage: string;

  @ApiPropertyOptional()
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  public file: any;
}
