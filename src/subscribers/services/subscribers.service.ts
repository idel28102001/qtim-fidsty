import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FindOneOptions, Repository } from 'typeorm';
import { SubscriberEntity } from '../entities/subscriber.entity';
import { TelegramClient } from 'telegram';
import { SubscribersTokensEnum } from '../enums/subscribers-tokens.enum';

@Injectable()
export class SubscribersService {
  constructor(
    @Inject(SubscribersTokensEnum.SUBSCRIBERS_REPOSITORY_TOKEN)
    private readonly subscriberRepo: Repository<SubscriberEntity>,
  ) {}

  get repo() {
    return this.subscriberRepo;
  }

  async getOrCreateSub(telegramId: string, client: TelegramClient) {
    const user = await this.subscriberRepo
      .createQueryBuilder('subs')
      .where(`subs.telegramId=:telegramId`, { telegramId })
      .select(['subs.id'])
      .getOne();
    if (!user) {
      const entity = (await client.getEntity(telegramId)) as any;
      const userEnt = this.subscriberRepo.create({
        telegramId,
        username: entity.username,
        lastName: entity.lastName,
        firstName: entity.firstName,
      });
      return await this.subscriberRepo.save(userEnt);
    }
    return user;
  }

  async save(data) {
    return (await this.subscriberRepo.save(data)) as any as SubscriberEntity;
  }

  async findByTelegramIdWithOpts(
    telegramId: string,
    options?: FindOneOptions<SubscriberEntity>,
  ) {
    return await this.subscriberRepo.findOne({
      where: { telegramId },
      ...options,
    });
  }

  async findByIdWithOpts(
    id: number,
    options: FindOneOptions<SubscriberEntity>,
  ) {
    try {
      return await this.subscriberRepo.findOneOrFail({
        where: { id },
        ...options,
      });
    } catch (e) {
      throw new NotFoundException('User not found');
    }
  }

  create(data): SubscriberEntity {
    return this.subscriberRepo.create(data) as any as SubscriberEntity;
  }

  async delete(id: number) {
    return this.subscriberRepo.delete(id);
  }

  async remove(sub: SubscriberEntity) {
    return this.subscriberRepo.remove(sub);
  }

  async createSubscriber(chatId, botClient: TelegramClient) {
    const sub = await this.findByTelegramIdWithOpts(chatId.toString());
    if (sub) return sub;
    else {
      const { firstName, lastName, username } = (await botClient.getEntity(
        chatId,
      )) as any;
      const currSub = this.create({
        firstName,
        lastName,
        username,
        chatId: chatId.toString(),
      }) as any as SubscriberEntity;
      return await this.save(currSub);
    }
  }
}
