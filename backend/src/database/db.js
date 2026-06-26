const dotenv = require('dotenv');
const pkg = require('pg');
const { Pool } = pkg;
const path = require('path');

// dotenv.config({path: path.resolve(__dirname, '../.env')});

class DB_Connection {
    static #instance;
    pool;

    constructor() {
        if (DB_Connection.#instance) {
            return DB_Connection.#instance;
        }

        // console.log('Database URL:', process.env.DATABASE_URL);

        const useSSL = process.env.DB_SSL === 'true' ||
            (process.env.DATABASE_URL || '').includes('sslmode=require');

        const connectionConfig = {
            connectionString: process.env.DATABASE_URL,
            ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
            // Neon (serverless Postgres) drops idle connections after ~5 min.
            // Keep client-side idle timeout shorter so the pool discards stale
            // connections before Neon does, preventing "Connection terminated" crashes.
            max: 10,
            idleTimeoutMillis: 30_000,       // drop idle client after 30 s
            connectionTimeoutMillis: 10_000, // fail fast if DB unreachable
        };

        this.pool = new Pool(connectionConfig);

        this.pool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err);
        });

        this.pool.query('SELECT NOW()')
            .then(() => console.log('✅ Database connected successfully'))
            .catch((err) => {
                console.error('❌ Database connection failed:');
                // console.error(err);
            });

        DB_Connection.#instance = this;
    }

    static getInstance() {
        if (!DB_Connection.#instance) {
            DB_Connection.#instance = new DB_Connection();
        }

        return DB_Connection.#instance;
    }

    query_executor = async (query, params = []) => {
        // Use pool.query() instead of pool.connect()+release so the pool owns
        // the client lifecycle. Checked-out clients from pool.connect() can emit
        // unhandled 'error' events if the connection drops between acquire and
        // release — pool.query() avoids that entirely.
        try {
            const result = await this.pool.query(query, params);
            return result;
        } catch (error) {
            console.log("Error executing database query: " + error.message);
            throw error;
        }
    }
}

module.exports = DB_Connection;
