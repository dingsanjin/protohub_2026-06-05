import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('file_folder', (table) => {
    table.integer('file_id').unsigned().notNullable();
    table.integer('folder_id').unsigned().notNullable();

    table.primary(['file_id', 'folder_id']);
    table.foreign('file_id').references('files.id').onDelete('CASCADE');
    table.foreign('folder_id').references('folders.id').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('file_folder');
}
