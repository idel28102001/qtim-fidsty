import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { PhotoEntity } from './photo.entity';
import { DocumentEntity } from '../document/document.entity';

@Entity('photo-size')
export class PhotoSizeEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;
  @Column()
  type: string;

  @Column({ nullable: true })
  w: number;

  @Column({ nullable: true })
  h: number;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @ManyToOne(() => PhotoEntity, (photo) => photo.sizes)
  photo: PhotoEntity;

  @ManyToOne(() => DocumentEntity, (photo) => photo.thumbs)
  document: DocumentEntity;
}
