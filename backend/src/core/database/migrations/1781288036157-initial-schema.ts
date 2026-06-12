import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1781288036157 implements MigrationInterface {
  name = 'InitialSchema1781288036157';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = process.env.POSTGRES_SCHEMA;
    if (!schema) {
      throw new Error('POSTGRES_SCHEMA is required for migration.');
    }
    await queryRunner.query(
      `CREATE TYPE "${schema}"."chat_members_role_enum" AS ENUM('owner', 'admin', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."chat_members" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "chat_id" integer NOT NULL, "user_id" integer NOT NULL, "role" "${schema}"."chat_members_role_enum" NOT NULL DEFAULT 'member', "last_read_at" TIMESTAMP WITH TIME ZONE, "chat_history_cleared_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_chat_members_chat_id_user_id" UNIQUE ("chat_id", "user_id"), CONSTRAINT "PK_aea646f59c92c47af5804ce73a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "${schema}"."chats_type_enum" AS ENUM('direct', 'group')`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."chats" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "type" "${schema}"."chats_type_enum" NOT NULL, "name" character varying(100), "avatar_file_id" integer, "created_by_id" integer, "direct_key" character varying(32), "last_message_id" integer, CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_chats_direct_key" ON "${schema}"."chats" ("direct_key") WHERE "direct_key" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."messages" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "chat_id" integer NOT NULL, "sender_id" integer NOT NULL, "content" text, "edited_at" TIMESTAMP WITH TIME ZONE, "client_id" character varying(64), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_messages_sender_id_client_id" ON "${schema}"."messages" ("sender_id", "client_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IX_messages_chat_id_id" ON "${schema}"."messages" ("chat_id", "id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "${schema}"."files_kind_enum" AS ENUM('user_avatar', 'chat_avatar', 'message_attachment')`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."files" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "kind" "${schema}"."files_kind_enum" NOT NULL, "storage_key" character varying(500) NOT NULL, "thumbnail_storage_key" character varying(500), "original_name" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "size_bytes" integer NOT NULL, "width" integer, "height" integer, "message_id" integer, "uploaded_by_id" integer NOT NULL, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IX_files_uploaded_by_id" ON "${schema}"."files" ("uploaded_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IX_files_message_id" ON "${schema}"."files" ("message_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."sessions" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "user_id" integer NOT NULL, "refresh_token_hash" character varying(128) NOT NULL, "previous_refresh_token_hash" character varying(128), "user_agent" character varying(512), "ip_address" character varying(64), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_used_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_refresh_token_hash" ON "${schema}"."sessions" ("refresh_token_hash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_previous_refresh_token_hash" ON "${schema}"."sessions" ("previous_refresh_token_hash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."push_subscriptions" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "user_id" integer NOT NULL, "session_id" integer NOT NULL, "endpoint" character varying(1024) NOT NULL, "p256dh" character varying(255) NOT NULL, "auth" character varying(255) NOT NULL, "user_agent" character varying(512), CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0008bdfd174e533a3f98bf9af1" ON "${schema}"."push_subscriptions" ("endpoint") `,
    );
    await queryRunner.query(
      `CREATE TYPE "${schema}"."users_theme_enum" AS ENUM('light', 'dark', 'system')`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."users" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "username" character varying(32) NOT NULL, "email" character varying(255), "password" character varying(255) NOT NULL, "nickname" character varying(64) NOT NULL, "avatar_file_id" integer, "bio" text, "push_enabled" boolean NOT NULL DEFAULT true, "theme" "${schema}"."users_theme_enum" NOT NULL DEFAULT 'system', "storage_used_bytes" bigint NOT NULL DEFAULT '0', "last_seen_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "CHK_users_email_lowercase" CHECK (email IS NULL OR email = LOWER(email)), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chat_members" ADD CONSTRAINT "FK_29ffb4b6edf59a7862129765339" FOREIGN KEY ("chat_id") REFERENCES "${schema}"."chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chat_members" ADD CONSTRAINT "FK_9dc61e92eed1dc151c2b2ef01a0" FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chats" ADD CONSTRAINT "FK_9651d68d84cdec3dc080e6b342b" FOREIGN KEY ("avatar_file_id") REFERENCES "${schema}"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chats" ADD CONSTRAINT "FK_858cd2fadae391d81abebec30b3" FOREIGN KEY ("created_by_id") REFERENCES "${schema}"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chats" ADD CONSTRAINT "FK_07b7d9dde84f3d2f0403de3bf09" FOREIGN KEY ("last_message_id") REFERENCES "${schema}"."messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."messages" ADD CONSTRAINT "FK_7540635fef1922f0b156b9ef74f" FOREIGN KEY ("chat_id") REFERENCES "${schema}"."chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."files" ADD CONSTRAINT "FK_63ee0a7c78bd7a1968a0893edab" FOREIGN KEY ("message_id") REFERENCES "${schema}"."messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."files" ADD CONSTRAINT "FK_b25b4b9c85b6e6ffa2789dc5da5" FOREIGN KEY ("uploaded_by_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."push_subscriptions" ADD CONSTRAINT "FK_6771f119f1c06d2ccf38f238664" FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."push_subscriptions" ADD CONSTRAINT "FK_d1de1cf3978af9932b61f122913" FOREIGN KEY ("session_id") REFERENCES "${schema}"."sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" ADD CONSTRAINT "FK_65eb1fa7df7811daaec973798ce" FOREIGN KEY ("avatar_file_id") REFERENCES "${schema}"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = process.env.POSTGRES_SCHEMA;
    if (!schema) {
      throw new Error('POSTGRES_SCHEMA is required for migration.');
    }
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" DROP CONSTRAINT "FK_65eb1fa7df7811daaec973798ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."push_subscriptions" DROP CONSTRAINT "FK_d1de1cf3978af9932b61f122913"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."push_subscriptions" DROP CONSTRAINT "FK_6771f119f1c06d2ccf38f238664"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."files" DROP CONSTRAINT "FK_b25b4b9c85b6e6ffa2789dc5da5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."files" DROP CONSTRAINT "FK_63ee0a7c78bd7a1968a0893edab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."messages" DROP CONSTRAINT "FK_7540635fef1922f0b156b9ef74f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chats" DROP CONSTRAINT "FK_07b7d9dde84f3d2f0403de3bf09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chats" DROP CONSTRAINT "FK_858cd2fadae391d81abebec30b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chats" DROP CONSTRAINT "FK_9651d68d84cdec3dc080e6b342b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chat_members" DROP CONSTRAINT "FK_9dc61e92eed1dc151c2b2ef01a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."chat_members" DROP CONSTRAINT "FK_29ffb4b6edf59a7862129765339"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."users"`);
    await queryRunner.query(`DROP TYPE "${schema}"."users_theme_enum"`);
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_0008bdfd174e533a3f98bf9af1"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."push_subscriptions"`);
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_sessions_previous_refresh_token_hash"`,
    );
    await queryRunner.query(
      `DROP INDEX "${schema}"."IDX_sessions_refresh_token_hash"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."sessions"`);
    await queryRunner.query(`DROP INDEX "${schema}"."IX_files_message_id"`);
    await queryRunner.query(`DROP INDEX "${schema}"."IX_files_uploaded_by_id"`);
    await queryRunner.query(`DROP TABLE "${schema}"."files"`);
    await queryRunner.query(`DROP TYPE "${schema}"."files_kind_enum"`);
    await queryRunner.query(`DROP INDEX "${schema}"."IX_messages_chat_id_id"`);
    await queryRunner.query(
      `DROP INDEX "${schema}"."UQ_messages_sender_id_client_id"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."messages"`);
    await queryRunner.query(`DROP INDEX "${schema}"."UQ_chats_direct_key"`);
    await queryRunner.query(`DROP TABLE "${schema}"."chats"`);
    await queryRunner.query(`DROP TYPE "${schema}"."chats_type_enum"`);
    await queryRunner.query(`DROP TABLE "${schema}"."chat_members"`);
    await queryRunner.query(`DROP TYPE "${schema}"."chat_members_role_enum"`);
  }
}
