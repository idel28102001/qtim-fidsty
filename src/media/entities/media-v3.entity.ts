import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelPostEntity } from '../../channels/entities/channel-post.entity';
import { DocumentEntity } from './media/document/document.entity';
import { PhotoEntity } from './media/photo/photo.entity';
import { WelcomeMessageEntity } from '../../posts/entities/posts/welcome-message.entity';
import { DiffTypePostsEntity } from '../../posts/entities/posts/diff-type-posts.entity';

@Entity('media-v3')
export class MediaV3Entity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @OneToOne(() => DiffTypePostsEntity, (diff) => diff.attachedPreview)
  preview: DiffTypePostsEntity;

  @ManyToOne(() => DiffTypePostsEntity, (diff) => diff.attachedSpoiler, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  spoiler: DiffTypePostsEntity;

  @ManyToOne(() => ChannelPostEntity, (post) => post.attachedfiles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  channel_posts: ChannelPostEntity;

  @OneToOne(() => WelcomeMessageEntity, (welcome) => welcome.welcomecontent)
  welcome: WelcomeMessageEntity;

  @OneToOne(() => WelcomeMessageEntity, (welcome) => welcome.paymentcontent)
  payment: WelcomeMessageEntity;

  @OneToOne(() => DocumentEntity, (document) => document.mediav3)
  @JoinColumn()
  document: DocumentEntity;

  @OneToOne(() => PhotoEntity, (photo) => photo.mediav3)
  @JoinColumn()
  photo: PhotoEntity;
}
