import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MediaV3Entity } from '../../../media/entities/media-v3.entity';
import { CoursesEntity } from './courses.entity';

@Entity('welcome-message')
export class WelcomeMessageEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => CoursesEntity, (course) => course.welcome, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  course: CoursesEntity;

  @Column('bytea')
  welcomeMessage: Buffer;

  @OneToOne(() => MediaV3Entity, (media) => media.welcome)
  @JoinColumn()
  welcomecontent: MediaV3Entity;

  @Column('bytea')
  paymentMessage: Buffer;

  @OneToOne(() => MediaV3Entity, (media) => media.payment)
  @JoinColumn()
  paymentcontent: MediaV3Entity;
}
