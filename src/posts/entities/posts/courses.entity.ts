import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BotEntity } from '../../../bots/entities/bot.entity';
import { WelcomeMessageEntity } from './welcome-message.entity';
import { DiffTypePostsEntity } from './diff-type-posts.entity';

@Entity('courses')
export class CoursesEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt: Date;

  @Column('text')
  title: string;

  @Column()
  cost: number;

  @Column({ nullable: true, default: 'RUB' })
  currency: string;

  @ManyToOne(() => BotEntity, (bot) => bot.courses, {
    nullable: true,
  })
  bot: BotEntity;

  @OneToOne(() => WelcomeMessageEntity, (post) => post.course)
  welcome: WelcomeMessageEntity;

  @OneToMany(() => DiffTypePostsEntity, (post) => post.course, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  posts: DiffTypePostsEntity[];
}
