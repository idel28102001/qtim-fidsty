import { Telegraf } from 'telegraf';

export interface TelegrafBotsInterface {
  token: string;
  bot: Telegraf;
}
