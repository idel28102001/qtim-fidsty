import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BotEntity } from '../../../bots/entities/bot.entity';
import { CoursesEntity } from './courses.entity';
import { TypeOfPostsEnum } from '../../enums/type-of-posts.enum';
import { MediaV3Entity } from '../../../media/entities/media-v3.entity';
import { SubscriberEntity } from '../../../subscribers/entities/subscriber.entity';

@Entity('diff-posts')
export class DiffTypePostsEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ default: TypeOfPostsEnum.ONETIMEPOSTS })
  type: string;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt: Date;

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('bigint', { nullable: true })
  delay: number;

  @Column({ nullable: true })
  order: number;

  @Column('text', { nullable: true })
  previewDescription: string;

  @OneToMany(() => MediaV3Entity, (mediav3) => mediav3.spoiler, {
    nullable: true,
  })
  attachedSpoiler: MediaV3Entity[];

  @OneToOne(() => MediaV3Entity, (mediav3) => mediav3.preview, {
    nullable: true,
  })
  @JoinColumn()
  attachedPreview: MediaV3Entity;

  @Column({ nullable: true })
  cost: number;

  @Column({ nullable: true })
  currency: string;

  @ManyToOne(() => BotEntity, (bot) => bot.difftypeposts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  bot: BotEntity;

  @ManyToOne(() => CoursesEntity, (course) => course.posts, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  course: CoursesEntity;

  @ManyToMany(() => SubscriberEntity, (subs) => subs.posts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  subscribers: SubscriberEntity[];
}
