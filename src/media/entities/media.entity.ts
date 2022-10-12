import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users-center/entities/user.entity';

@Entity('media')
export class MediaEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @CreateDateColumn({ type: 'timestamp' })
  public readonly createdAt: string;

  @Column({ type: 'varchar' })
  public url: string;

  @Column({ type: 'varchar', nullable: true })
  public fileId: string;

  @Column({ type: 'varchar', nullable: true })
  public name: string;

  @Column({ type: 'varchar', nullable: true })
  public mediaType: string;

  @ManyToOne(() => UserEntity, (user) => user.verificationFiles, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public userFiles: UserEntity;
}
