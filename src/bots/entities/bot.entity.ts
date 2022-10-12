import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SubscriberEntity } from '../../subscribers/entities/subscriber.entity';
import { botStatus } from '../enums/bot.status.enum';
import { UserEntity } from '../../users-center/entities/user.entity';
import { DiffTypePostsEntity } from '../../posts/entities/posts/diff-type-posts.entity';
import { CoursesEntity } from '../../posts/entities/posts/courses.entity';

@Entity('bots')
export class BotEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @CreateDateColumn({ type: 'timestamp' })
  public readonly createdAt: string;

  @Column({ nullable: true })
  botSession: string;

  @Column({ type: 'varchar', nullable: true })
  public name: string;

  @Column({ type: 'varchar', nullable: true })
  public username: string;

  @Column({ type: 'varchar', nullable: true })
  public description: string;

  @Column({ type: 'varchar', nullable: true })
  public welcomeMessage: string;

  @Column({ type: 'varchar', nullable: true })
  public token: string;

  @Column({ type: 'varchar', nullable: true })
  public referralLink: string;

  @Column({ type: 'boolean', default: false })
  public primaryBot: boolean;

  @Column({
    type: 'enum',
    enum: botStatus,
    default: botStatus.ACTIVATED,
    nullable: false,
  })
  public status: botStatus;

  @ManyToOne(() => UserEntity, (user) => user.bots, {
    onDelete: 'CASCADE',
  })
  public owner: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.bots_managers, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
  })
  managers: UserEntity[];
  @ManyToMany(() => SubscriberEntity, (subscriber) => subscriber.blacklist, {
    nullable: true,
    cascade: true,
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
  })
  @JoinTable({
    name: 'block-sub-bots',
    joinColumn: { name: 'subscribers', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'bots', referencedColumnName: 'id' },
  })
  blacklist: SubscriberEntity[];

  @ManyToMany(() => SubscriberEntity, (subscriber) => subscriber.bots, {
    nullable: true,
    cascade: true,
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
  })
  @JoinTable({
    name: 'sub-bots',
    joinColumn: { name: 'subscribers', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'bots', referencedColumnName: 'id' },
  })
  public subscribers: SubscriberEntity[];

  @OneToMany(() => DiffTypePostsEntity, (difftypepost) => difftypepost.bot, {})
  difftypeposts: DiffTypePostsEntity[];

  @OneToMany(() => CoursesEntity, (oneoffpost) => oneoffpost.bot)
  courses: CoursesEntity[];
}
