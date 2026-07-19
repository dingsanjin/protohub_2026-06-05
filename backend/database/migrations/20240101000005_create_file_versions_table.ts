import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('file_versions', (table) => {
    table.increments('id').primary();
    table.integer('file_id').unsigned().notNullable().references('files.id').onDelete('CASCADE');
    table.integer('version_number').notNullable().defaultTo(1);
    table.string('storage_path').notNullable();
    table.string('original_name').notNullable();
    table.bigInteger('size').notNullable();
    table.string('type').notNullable();
    table.string('note').nullable();
    table.integer('created_by').unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['file_id', 'version_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('file_versions');
}
