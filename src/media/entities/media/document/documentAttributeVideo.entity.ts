import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Api } from 'telegram';
import PhotoSize = Api.PhotoSize;
import { PhotoSizeEntity } from '../photo/photo-size.entity';
import { VideoSizeEntity } from '../photo/video-size.entity';
import { DocumentEntity } from './document.entity';

@Entity('document-attribute-video')
export class DocumentAttributeVideoEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @Column()
  roundMessage?: boolean;

  @Column()
  supportsStreaming?: boolean;

  @Column()
  duration: number;

  @Column()
  w: number;
  @Column()
  h: number;

  @ManyToOne(() => DocumentEntity, (document) => document.attributes)
  document: DocumentEntity;
}
