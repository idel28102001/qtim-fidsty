import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { PhotoEntity } from './photo.entity';
import { DocumentEntity } from '../document/document.entity';

@Entity('video-size')
export class VideoSizeEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;
  @Column()
  type: string;

  @Column()
  w: number;

  @Column()
  h: number;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'bigint', default: 0 })
  videoStartTs?: number;

  @ManyToOne(() => PhotoEntity, (photo) => photo.videosizes)
  photo: PhotoEntity;

  @ManyToOne(() => DocumentEntity, (photo) => photo.videothumbs)
  document: DocumentEntity;
}
