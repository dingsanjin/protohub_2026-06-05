import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await knex('users').insert([
    {
      username: 'admin',
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
    },
  ]);
}
