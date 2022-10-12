import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Api } from 'telegram';
import PhotoSize = Api.PhotoSize;
import { PhotoSizeEntity } from './photo-size.entity';
import { VideoSizeEntity } from './video-size.entity';
import { MediaV3Entity } from '../../media-v3.entity';

@Entity('photo')
export class PhotoEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @Column()
  hasStickers: boolean;

  @Column({ default: 'image/jpg' })
  mimeType: string;

  @Column({ type: 'bytea' })
  telegramId: Buffer;

  @Column({ type: 'bytea' })
  accessHash: Buffer;

  @Column({ type: 'bytea', nullable: false })
  fileReference: Buffer;

  @Column({ type: 'bigint' })
  date: number;

  @OneToMany(() => PhotoSizeEntity, (photoSize) => photoSize.photo, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  sizes: PhotoSizeEntity[];

  @OneToMany(() => VideoSizeEntity, (photoSize) => photoSize.photo, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  videosizes: PhotoSizeEntity[];

  @Column()
  dcId: number;

  @OneToOne(() => MediaV3Entity, (mediav3) => mediav3.photo)
  mediav3: MediaV3Entity;
}
