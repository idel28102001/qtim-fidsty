import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelsEntity } from './channels.entity';
import { MediaV3Entity } from '../../media/entities/media-v3.entity';

@Entity('channel-posts')
export class ChannelPostEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @Column()
  messageId: number;

  @Column({ default: false })
  scheduled: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  public readonly createdAt: string;

  @Column({ type: 'varchar', nullable: true })
  public title: string;

  @Column({ type: 'text', nullable: true })
  public description: string;

  @Column({ type: 'timestamptz', nullable: false })
  public datePublic: Date;

  @Column({ type: 'json', nullable: true })
  messageIds: string;

  @OneToMany(() => MediaV3Entity, (media) => media.channel_posts, {
    nullable: true,
    cascade: true,
  })
  public attachedfiles: MediaV3Entity[];

  @ManyToOne(() => ChannelsEntity, (channel) => channel.posts, {
    onDelete: 'CASCADE',
  })
  public channel: ChannelsEntity;
}
