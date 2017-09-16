/* Dependencies */
const Storage = require('./lib/storage');

const storage = new Storage(
{
    dbId: process.env.DB_ID,
    dbName: process.env.DB_NAME,
    tableName: process.env.DB_TABLE,
    credentials: process.env.DB_CREDS
});

storage.toString();

