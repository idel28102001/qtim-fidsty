import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBotDto {
  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsNotEmpty()
  @IsString()
  public username: string;

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
  file: any;
}
