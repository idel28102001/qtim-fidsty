import { PartialType } from '@nestjs/swagger';
import { CreateChannelDto } from './create-channel.dto';

export class EditChannelDto extends PartialType(CreateChannelDto) {}
