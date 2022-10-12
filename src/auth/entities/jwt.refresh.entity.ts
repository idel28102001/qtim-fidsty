import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users-center/entities/user.entity';

@Entity()
export class JwtRefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @OneToOne(() => UserEntity, (user) => user.jwtRefreshToken, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: UserEntity;
}
