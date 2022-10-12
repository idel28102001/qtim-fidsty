import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BotEntity } from '../../bots/entities/bot.entity';
import { DiffTypePostsEntity } from '../../posts/entities/posts/diff-type-posts.entity';

@Entity('subscribers')
export class SubscriberEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @CreateDateColumn({ type: 'timestamp' })
  public readonly createdAt: string;

  @Column({ nullable: true })
  public telegramId: string;

  @Column({ type: 'varchar', nullable: true })
  public firstName: string;

  @Column({ type: 'varchar', nullable: true })
  public lastName: string;

  @Column({ type: 'varchar', nullable: true })
  public username: string;

  @ManyToMany(() => BotEntity, (bot) => bot.blacklist, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
  })
  blacklist: BotEntity[];

  @ManyToMany(() => BotEntity, (bot) => bot.subscribers, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
  })
  bots: BotEntity[];

  @ManyToMany(() => DiffTypePostsEntity, (diff) => diff.subscribers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable({
    name: 'subscribers_posts',
    joinColumn: {
      name: 'subscribers',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: { name: 'diff-posts', referencedColumnName: 'id' },
  })
  posts: DiffTypePostsEntity[];
}
