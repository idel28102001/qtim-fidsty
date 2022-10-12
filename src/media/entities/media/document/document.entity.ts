import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Api } from 'telegram';
import PhotoSize = Api.PhotoSize;
import { PhotoSizeEntity } from '../photo/photo-size.entity';
import { VideoSizeEntity } from '../photo/video-size.entity';
import { DocumentAttributeVideoEntity } from './documentAttributeVideo.entity';
import { MediaV3Entity } from '../../media-v3.entity';

@Entity('document')
export class DocumentEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;
  @Column({ type: 'bytea' })
  telegramId: Buffer;

  @Column({ type: 'bytea' })
  accessHash: Buffer;

  @Column({ type: 'bytea', nullable: false })
  fileReference: Buffer;

  @Column({ type: 'bigint' })
  date: number;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @OneToMany(() => PhotoSizeEntity, (photoSize) => photoSize.document, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  thumbs: PhotoSizeEntity[];

  @OneToMany(() => VideoSizeEntity, (videoSize) => videoSize.document, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  videothumbs: VideoSizeEntity[];

  @OneToMany(
    () => DocumentAttributeVideoEntity,
    (attribute) => attribute.document,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  attributes: DocumentAttributeVideoEntity[];

  @Column()
  dcId: number;

  @OneToOne(() => MediaV3Entity, (mediav3) => mediav3.document)
  mediav3: MediaV3Entity;
}
