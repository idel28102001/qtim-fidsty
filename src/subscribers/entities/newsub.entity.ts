import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { BotEntity } from '../../bots/entities/bot.entity';
import { ChannelsEntity } from '../../channels/entities/channels.entity';

@Entity('newsub')
export class NewsubEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @CreateDateColumn({ type: 'timestamp' })
  public readonly createdAt: string;

  @Column()
  userId: string;

  @Column()
  channelId: string;
}
