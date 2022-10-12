import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1658774662807 implements MigrationInterface {
  name = 'migration1658774662807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "channels" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "channelId" character varying NOT NULL, "title" character varying, "about" text DEFAULT '', "username" character varying, "userId" integer, CONSTRAINT "UQ_f41d20ad5f355605bde63265d66" UNIQUE ("channelId"), CONSTRAINT "PK_bc603823f3f741359c2339389f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "channel-posts" ("id" SERIAL NOT NULL, "messageId" integer NOT NULL, "scheduled" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying, "description" text, "datePublic" TIMESTAMP WITH TIME ZONE NOT NULL, "messageIds" json, "channelId" integer, CONSTRAINT "PK_d95ced6cf99390e0d86bdb8d0c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "video-size" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "w" integer NOT NULL, "h" integer NOT NULL, "size" bigint NOT NULL, "videoStartTs" bigint NOT NULL DEFAULT '0', "photoId" integer, "documentId" integer, CONSTRAINT "PK_4e6ab0ff2bcf14ce169b7f6e51a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "photo" ("id" SERIAL NOT NULL, "hasStickers" boolean NOT NULL, "mimeType" character varying NOT NULL DEFAULT 'image/jpg', "telegramId" bytea NOT NULL, "accessHash" bytea NOT NULL, "fileReference" bytea NOT NULL, "date" bigint NOT NULL, "dcId" integer NOT NULL, CONSTRAINT "PK_723fa50bf70dcfd06fb5a44d4ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "photo-size" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "w" integer, "h" integer, "size" bigint NOT NULL DEFAULT '0', "photoId" integer, "documentId" integer, CONSTRAINT "PK_063d388e7a5fddb99b9ff2f12c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "document-attribute-video" ("id" SERIAL NOT NULL, "roundMessage" boolean NOT NULL, "supportsStreaming" boolean NOT NULL, "duration" integer NOT NULL, "w" integer NOT NULL, "h" integer NOT NULL, "documentId" integer, CONSTRAINT "PK_b3608799af17179a5b409d7dd1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "document" ("id" SERIAL NOT NULL, "telegramId" bytea NOT NULL, "accessHash" bytea NOT NULL, "fileReference" bytea NOT NULL, "date" bigint NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "dcId" integer NOT NULL, CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "media-v3" ("id" SERIAL NOT NULL, "spoilerId" integer, "channelPostsId" integer, "documentId" integer, "photoId" integer, CONSTRAINT "REL_6ff36ce3e71e6707068260e570" UNIQUE ("documentId"), CONSTRAINT "REL_f835941bf188ea5e3882483cec" UNIQUE ("photoId"), CONSTRAINT "PK_409491c7cbbd9580ceff4e7b6b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "welcome-message" ("id" SERIAL NOT NULL, "welcomeMessage" bytea NOT NULL, "paymentMessage" bytea NOT NULL, "courseId" integer, "welcomecontentId" integer, "paymentcontentId" integer, CONSTRAINT "REL_93cf93bcf48b5ea4aebf1df491" UNIQUE ("courseId"), CONSTRAINT "REL_67a748d8de453d9ec4e27b0ef4" UNIQUE ("welcomecontentId"), CONSTRAINT "REL_6350b0d4501dd6b4bf1c934a27" UNIQUE ("paymentcontentId"), CONSTRAINT "PK_f55cd22afec5678e35e2f2bc7e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "title" text NOT NULL, "cost" integer NOT NULL, "currency" character varying DEFAULT 'RUB', "botId" integer, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "diff-posts" ("id" SERIAL NOT NULL, "type" character varying NOT NULL DEFAULT 'one-off', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "title" text NOT NULL, "description" text NOT NULL, "delay" bigint, "order" integer, "previewDescription" text, "cost" integer, "currency" character varying, "attachedPreviewId" integer, "botId" integer, "courseId" integer, CONSTRAINT "REL_52c0ea345f5795f8e2d16e95d8" UNIQUE ("attachedPreviewId"), CONSTRAINT "PK_42c7f3ef0879d4f961d9e57c1b1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscribers" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "telegramId" character varying, "firstName" character varying, "lastName" character varying, "username" character varying, CONSTRAINT "PK_cbe0a7a9256c826f403c0236b67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bots" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "botSession" character varying, "name" character varying, "username" character varying, "description" character varying, "welcomeMessage" character varying, "token" character varying, "referralLink" character varying, "primaryBot" boolean NOT NULL DEFAULT false, "status" "public"."bots_status_enum" NOT NULL DEFAULT 'ACTIVATED', "ownerId" integer, CONSTRAINT "PK_8b1b0180229dec2cbfdf5e776e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "media" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "url" character varying NOT NULL, "fileId" character varying, "name" character varying, "mediaType" character varying, "userFilesId" integer, CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying, "surname" character varying, "country" character varying, "photo" character varying, "dateOfBirth" date, "email" character varying, "phoneNumber" character varying, "phoneCodeHash" character varying, "sessionHash" character varying NOT NULL DEFAULT '', "temporarySessionHash" character varying, "passwordHash" character varying, "confirmRegisterToken" character varying, "recoverPasswordCode" character varying, "freezing" boolean NOT NULL DEFAULT false, "registrationStatus" "public"."users_registrationstatus_enum" NOT NULL DEFAULT 'CONFIRM_EMAIL', "verificationStatus" "public"."users_verificationstatus_enum" NOT NULL DEFAULT 'NOT_CONFIRMED', "role" "public"."users_role_enum" NOT NULL DEFAULT 'owner', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "jwt_refresh_token" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "userId" integer, CONSTRAINT "REL_a507f8c27d13a22c6ee600e852" UNIQUE ("userId"), CONSTRAINT "PK_35f83b4dd71582d1fb1d3dfcebf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "newsub" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying NOT NULL, "channelId" character varying NOT NULL, CONSTRAINT "PK_500328683b4aa17c25240cc9fc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscribers_posts" ("subscribers" integer NOT NULL, "diff-posts" integer NOT NULL, CONSTRAINT "PK_1770193339ea2de88004a5da5a1" PRIMARY KEY ("subscribers", "diff-posts"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd3f3ee369a6c3ef6a9b19f686" ON "subscribers_posts" ("subscribers") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56b9f04057e526ee9d62af2a8c" ON "subscribers_posts" ("diff-posts") `,
    );
    await queryRunner.query(
      `CREATE TABLE "block-sub-bots" ("subscribers" integer NOT NULL, "bots" integer NOT NULL, CONSTRAINT "PK_388683d264b8589ad215b6ac2c1" PRIMARY KEY ("subscribers", "bots"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05caf9eb70c6d0ddfc47edf3d8" ON "block-sub-bots" ("subscribers") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4019d34a88d7cfb09be69bfc78" ON "block-sub-bots" ("bots") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sub-bots" ("subscribers" integer NOT NULL, "bots" integer NOT NULL, CONSTRAINT "PK_0de9c09a2d14cc5d340f79829d8" PRIMARY KEY ("subscribers", "bots"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a9eab843bef1eb0a90e42491c" ON "sub-bots" ("subscribers") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f28a864e6eb594b5f954f10591" ON "sub-bots" ("bots") `,
    );
    await queryRunner.query(
      `CREATE TABLE "bots-managers" ("bots" integer NOT NULL, "users" integer NOT NULL, CONSTRAINT "PK_5635a00d23e41c268aaa5a6ba95" PRIMARY KEY ("bots", "users"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_347837ce637946d514658dd482" ON "bots-managers" ("bots") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29d33f917a980284c75c79a1a5" ON "bots-managers" ("users") `,
    );
    await queryRunner.query(
      `ALTER TABLE "channels" ADD CONSTRAINT "FK_b89f82f218818e3d7e0a09b65d2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel-posts" ADD CONSTRAINT "FK_158eb34f84b842b139115630335" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "video-size" ADD CONSTRAINT "FK_44bf3707378348ccd34f69bc001" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "video-size" ADD CONSTRAINT "FK_1c8b4bc403335cb21781c758c82" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "photo-size" ADD CONSTRAINT "FK_91ee033fe3fd89879a758c189f7" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "photo-size" ADD CONSTRAINT "FK_fc2f7dce17f35e9b50ddb85e20f" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document-attribute-video" ADD CONSTRAINT "FK_54d1591f0bd7a9e49ac4c6e8282" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media-v3" ADD CONSTRAINT "FK_9d8f9a7fd481bca06bdf1610f9e" FOREIGN KEY ("spoilerId") REFERENCES "diff-posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "media-v3" ADD CONSTRAINT "FK_12b545dad928a7dbe12981e96f6" FOREIGN KEY ("channelPostsId") REFERENCES "channel-posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "media-v3" ADD CONSTRAINT "FK_6ff36ce3e71e6707068260e5703" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media-v3" ADD CONSTRAINT "FK_f835941bf188ea5e3882483ceca" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "welcome-message" ADD CONSTRAINT "FK_93cf93bcf48b5ea4aebf1df4917" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "welcome-message" ADD CONSTRAINT "FK_67a748d8de453d9ec4e27b0ef4a" FOREIGN KEY ("welcomecontentId") REFERENCES "media-v3"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "welcome-message" ADD CONSTRAINT "FK_6350b0d4501dd6b4bf1c934a27f" FOREIGN KEY ("paymentcontentId") REFERENCES "media-v3"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_edd9d4060805c1786d9ffb1f858" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "diff-posts" ADD CONSTRAINT "FK_52c0ea345f5795f8e2d16e95d8c" FOREIGN KEY ("attachedPreviewId") REFERENCES "media-v3"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "diff-posts" ADD CONSTRAINT "FK_8fea6cad7b1669c608a227c073e" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "diff-posts" ADD CONSTRAINT "FK_a8122447812e042570c0995e77f" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "bots" ADD CONSTRAINT "FK_199cf72ee6eb59ad8544c729290" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD CONSTRAINT "FK_6fc94009d1694a2c4e46b4836e0" FOREIGN KEY ("userFilesId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jwt_refresh_token" ADD CONSTRAINT "FK_a507f8c27d13a22c6ee600e8526" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscribers_posts" ADD CONSTRAINT "FK_bd3f3ee369a6c3ef6a9b19f686d" FOREIGN KEY ("subscribers") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscribers_posts" ADD CONSTRAINT "FK_56b9f04057e526ee9d62af2a8c2" FOREIGN KEY ("diff-posts") REFERENCES "diff-posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "block-sub-bots" ADD CONSTRAINT "FK_05caf9eb70c6d0ddfc47edf3d86" FOREIGN KEY ("subscribers") REFERENCES "bots"("id") ON DELETE SET NULL ON UPDATE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "block-sub-bots" ADD CONSTRAINT "FK_4019d34a88d7cfb09be69bfc78a" FOREIGN KEY ("bots") REFERENCES "subscribers"("id") ON DELETE SET NULL ON UPDATE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub-bots" ADD CONSTRAINT "FK_0a9eab843bef1eb0a90e42491c5" FOREIGN KEY ("subscribers") REFERENCES "bots"("id") ON DELETE SET NULL ON UPDATE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub-bots" ADD CONSTRAINT "FK_f28a864e6eb594b5f954f10591a" FOREIGN KEY ("bots") REFERENCES "subscribers"("id") ON DELETE SET NULL ON UPDATE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "bots-managers" ADD CONSTRAINT "FK_347837ce637946d514658dd482c" FOREIGN KEY ("bots") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "bots-managers" ADD CONSTRAINT "FK_29d33f917a980284c75c79a1a59" FOREIGN KEY ("users") REFERENCES "bots"("id") ON DELETE SET NULL ON UPDATE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bots-managers" DROP CONSTRAINT "FK_29d33f917a980284c75c79a1a59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bots-managers" DROP CONSTRAINT "FK_347837ce637946d514658dd482c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub-bots" DROP CONSTRAINT "FK_f28a864e6eb594b5f954f10591a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub-bots" DROP CONSTRAINT "FK_0a9eab843bef1eb0a90e42491c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "block-sub-bots" DROP CONSTRAINT "FK_4019d34a88d7cfb09be69bfc78a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "block-sub-bots" DROP CONSTRAINT "FK_05caf9eb70c6d0ddfc47edf3d86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscribers_posts" DROP CONSTRAINT "FK_56b9f04057e526ee9d62af2a8c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscribers_posts" DROP CONSTRAINT "FK_bd3f3ee369a6c3ef6a9b19f686d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jwt_refresh_token" DROP CONSTRAINT "FK_a507f8c27d13a22c6ee600e8526"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT "FK_6fc94009d1694a2c4e46b4836e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bots" DROP CONSTRAINT "FK_199cf72ee6eb59ad8544c729290"`,
    );
    await queryRunner.query(
      `ALTER TABLE "diff-posts" DROP CONSTRAINT "FK_a8122447812e042570c0995e77f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "diff-posts" DROP CONSTRAINT "FK_8fea6cad7b1669c608a227c073e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "diff-posts" DROP CONSTRAINT "FK_52c0ea345f5795f8e2d16e95d8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_edd9d4060805c1786d9ffb1f858"`,
    );
    await queryRunner.query(
      `ALTER TABLE "welcome-message" DROP CONSTRAINT "FK_6350b0d4501dd6b4bf1c934a27f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "welcome-message" DROP CONSTRAINT "FK_67a748d8de453d9ec4e27b0ef4a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "welcome-message" DROP CONSTRAINT "FK_93cf93bcf48b5ea4aebf1df4917"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media-v3" DROP CONSTRAINT "FK_f835941bf188ea5e3882483ceca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media-v3" DROP CONSTRAINT "FK_6ff36ce3e71e6707068260e5703"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media-v3" DROP CONSTRAINT "FK_12b545dad928a7dbe12981e96f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media-v3" DROP CONSTRAINT "FK_9d8f9a7fd481bca06bdf1610f9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document-attribute-video" DROP CONSTRAINT "FK_54d1591f0bd7a9e49ac4c6e8282"`,
    );
    await queryRunner.query(
      `ALTER TABLE "photo-size" DROP CONSTRAINT "FK_fc2f7dce17f35e9b50ddb85e20f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "photo-size" DROP CONSTRAINT "FK_91ee033fe3fd89879a758c189f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video-size" DROP CONSTRAINT "FK_1c8b4bc403335cb21781c758c82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video-size" DROP CONSTRAINT "FK_44bf3707378348ccd34f69bc001"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel-posts" DROP CONSTRAINT "FK_158eb34f84b842b139115630335"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channels" DROP CONSTRAINT "FK_b89f82f218818e3d7e0a09b65d2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_29d33f917a980284c75c79a1a5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_347837ce637946d514658dd482"`,
    );
    await queryRunner.query(`DROP TABLE "bots-managers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f28a864e6eb594b5f954f10591"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a9eab843bef1eb0a90e42491c"`,
    );
    await queryRunner.query(`DROP TABLE "sub-bots"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4019d34a88d7cfb09be69bfc78"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05caf9eb70c6d0ddfc47edf3d8"`,
    );
    await queryRunner.query(`DROP TABLE "block-sub-bots"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56b9f04057e526ee9d62af2a8c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd3f3ee369a6c3ef6a9b19f686"`,
    );
    await queryRunner.query(`DROP TABLE "subscribers_posts"`);
    await queryRunner.query(`DROP TABLE "newsub"`);
    await queryRunner.query(`DROP TABLE "jwt_refresh_token"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`DROP TABLE "bots"`);
    await queryRunner.query(`DROP TABLE "subscribers"`);
    await queryRunner.query(`DROP TABLE "diff-posts"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "welcome-message"`);
    await queryRunner.query(`DROP TABLE "media-v3"`);
    await queryRunner.query(`DROP TABLE "document"`);
    await queryRunner.query(`DROP TABLE "document-attribute-video"`);
    await queryRunner.query(`DROP TABLE "photo-size"`);
    await queryRunner.query(`DROP TABLE "photo"`);
    await queryRunner.query(`DROP TABLE "video-size"`);
    await queryRunner.query(`DROP TABLE "channel-posts"`);
    await queryRunner.query(`DROP TABLE "channels"`);
  }
}
