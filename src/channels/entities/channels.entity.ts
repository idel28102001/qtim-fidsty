import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users-center/entities/user.entity';
import { ChannelPostEntity } from './channel-post.entity';

@Entity('channels')
export class ChannelsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ unique: true, name: 'channelId' })
  channelId: string;

  @Column({ nullable: true })
  title: string;

  @Column('text', { default: '', nullable: true })
  about: string;

  @Column({ nullable: true })
  username: string;

  @ManyToOne(() => UserEntity, (user) => user.channels, {
    onDelete: 'SET NULL',
  })
  user: UserEntity;

  @OneToMany(() => ChannelPostEntity, (post) => post.channel, {
    nullable: true,
    cascade: true,
    onDelete: 'SET NULL',
  })
  public posts: ChannelPostEntity[];
}
