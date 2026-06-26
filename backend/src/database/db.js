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
            ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {})
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
        const start = Date.now();
        const client = await this.pool.connect();
        try {
            const result = await client.query(query, params);
            // if(process.env.LOG_SQL === 'true'){
            //     console.log(`[SQL ${Date.now()-start}ms] rows=${result.rowCount} :: ${query.split('\n').join(' ')}`);
            //     if(params.length) console.log('  params:', params);
            // }
            return result;
        } catch (error) {
            console.log("Error executing database query: " + error.message);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = DB_Connection;