import knex from 'knex';
import type { Knex } from 'knex';

const config: Record<string, Knex.Config> = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './database/dev.sqlite3',
    },
    useNullAsDefault: true,
  },
  production: {
    client: 'better-sqlite3',
    connection: {
      filename: './database/prod.sqlite3',
    },
    useNullAsDefault: true,
  },
};

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

export default db;
