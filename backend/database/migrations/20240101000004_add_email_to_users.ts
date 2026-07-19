import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('email').unique().nullable();
  });

  await knex('users').where('username', 'admin').update({
    email: 'admin@protohub.com',
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email');
  });
}