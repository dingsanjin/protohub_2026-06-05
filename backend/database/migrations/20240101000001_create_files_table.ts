import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('files', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('name').notNullable();
    table.string('original_name').notNullable();
    table.string('type').notNullable();
    table.bigInteger('size').notNullable();
    table.string('storage_path').notNullable();
    table.string('short_id').unique().notNullable();
    table.string('share_mode').notNullable().defaultTo('private');
    table.string('share_password').nullable();
    table.timestamp('expire_at').nullable();
    table.integer('visit_count').notNullable().defaultTo(0);
    table.timestamp('last_visited_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('users.id').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('files');
}
