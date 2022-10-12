import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { JwtRefreshToken } from '../../auth/entities/jwt.refresh.entity';
import { BotEntity } from '../../bots/entities/bot.entity';
import { MediaEntity } from '../../media/entities/media.entity';
import { ChannelsEntity } from '../../channels/entities/channels.entity';
import { registrationStatus } from '../../users/enums/registration.status.enum';
import { verificationStatus } from '../../users/enums/verification.status.enum';
import { UserRole } from '../../users/enums/user.role.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @CreateDateColumn({ type: 'timestamp' })
  public readonly createdAt: string;

  @Column({ type: 'varchar', nullable: true })
  public name: string;

  @Column({ type: 'varchar', nullable: true })
  public surname: string;

  @Column({ type: 'varchar', nullable: true })
  public country: string;

  @Column({ type: 'varchar', nullable: true })
  public photo: string;

  @Column({ type: 'date', nullable: true })
  public dateOfBirth: Date;

  @Column({ type: 'varchar', nullable: true })
  public email: string;

  @Column({ type: 'varchar', nullable: true })
  public phoneNumber: string;

  @Column({ nullable: true })
  public phoneCodeHash: string;

  @Column({ type: 'varchar', default: '' })
  sessionHash: string;

  @Column({ type: 'varchar', nullable: true })
  temporarySessionHash: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  passwordHash: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  confirmRegisterToken: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  recoverPasswordCode: string;

  @Column({ type: 'boolean', default: false })
  freezing: boolean;

  @Column({
    type: 'enum',
    enum: registrationStatus,
    default: registrationStatus.CONFIRM_EMAIL,
    nullable: false,
  })
  public registrationStatus: registrationStatus;

  @Column({
    type: 'enum',
    enum: verificationStatus,
    default: verificationStatus.NOT_CONFIRMED,
    nullable: false,
  })
  public verificationStatus: verificationStatus;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OWNER,
    nullable: false,
  })
  public role: UserRole;

  @OneToMany(() => MediaEntity, (media) => media.userFiles, {
    cascade: true,
  })
  public verificationFiles: MediaEntity[];

  @OneToOne(() => JwtRefreshToken, (jwtRefreshToken) => jwtRefreshToken.user, {
    onDelete: 'CASCADE',
  })
  jwtRefreshToken: JwtRefreshToken;

  @OneToMany(() => BotEntity, (bot) => bot.owner, {
    cascade: true,
  })
  public bots: BotEntity[];

  @ManyToMany(() => BotEntity, (bot) => bot.managers, {
    nullable: true,
    cascade: true,
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
  })
  @JoinTable({
    name: 'bots-managers',
    joinColumn: { name: 'bots', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'users', referencedColumnName: 'id' },
  })
  bots_managers: BotEntity[];

  @OneToMany(() => ChannelsEntity, (channel) => channel.user, { cascade: true })
  channels: ChannelsEntity[];
}
