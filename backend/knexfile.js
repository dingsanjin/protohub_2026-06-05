"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    development: {
        client: 'better-sqlite3',
        connection: {
            filename: './database/dev.sqlite3',
        },
        useNullAsDefault: true,
        migrations: {
            directory: './database/migrations',
        },
        seeds: {
            directory: './database/seeds',
        },
    },
    production: {
        client: 'better-sqlite3',
        connection: {
            filename: './database/prod.sqlite3',
        },
        useNullAsDefault: true,
        migrations: {
            directory: './database/migrations',
        },
        seeds: {
            directory: './database/seeds',
        },
    },
};
exports.default = config;
