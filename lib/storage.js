/* Dependencies */
const BigQuery = require('@google-cloud/bigquery');

/**
 * Sheets responsible for displaying data on google drive sheets
 * mostly for logging & monitoring purposes
 *
 * Takes a Sheet ID and credentials string
 */
module.exports = function (config)
{
    if (!config.dbId) throw new Error('dbId is required for storage init');
    if (!config.dbName) throw new Error('dbName is required for storage init');
    if (!config.credentials) throw new Error('credentials is required for storage init');

    const self = this;

    self.status = 'bare';
    self.record = recordData;
    self.download = downloadData;
    self.tables = {};

    setupDB(config);

    return self;

    /* Public methods */
    function recordData(exchange, data)
    {
        // If missing any data, return
        if (!exchange || !data) return Promise.resolve();

        // While already setting up, wait 100ms and retry
        if (self.status === 'error') return Promise.reject(new Error('Problem during setup'));

        // While not ready, wait 100ms and retry
        if (self.status !== 'ready') return wait(recordData, exchange, data);

        // While already setting up, wait 100ms and retry
        if (self.status === 'setting_up_table') return wait(recordData, exchange, data);

        // Setup table name using exchange and currency
        const tableName = exchange + '_' + data.currency;

        // Get table
        const table = self.tables[tableName];

        // If table was not setup yet, set it up
        if (!table)
        {
            return setupTable(tableName).then(function ()
            {
                return recordData(exchange, data);
            });
        }

        return table.insert([data]).catch((err) =>
        {
            if (err.name === 'PartialFailureError')
            {
                // err.errors (object[]):
                // err.errors[].row (original row object passed to `insert`)
                // err.errors[].errors[].reason
                // err.errors[].errors[].message
                err.errors.forEach((e) => console.error(e));
            }
            else console.error(err);
        });
    }

    function downloadData(exchange, currency, startDate, endDate)
    {
        // If missing exchange or currency, error
        if (!exchange || !currency) return Promise.reject(new Error('Exchange & currency required'));

        // If start or end dates are not passed, error
        if (!startDate || !endDate) return Promise.reject(new Error('Start & End dates required'));

        // While already setting up, wait 100ms and retry
        if (self.status === 'error') return Promise.reject(new Error('Problem during setup'));

        // While not ready, wait 100ms and downloadData
        if (self.status !== 'ready') return wait(downloadData, exchange, currency, startDate, endDate);

        // While already setting up, wait 100ms and retry
        if (self.status === 'setting_up_table') return wait(downloadData, exchange, currency, startDate, endDate);

        // Setup table name using exchange and currency
        const tableName = exchange + '_' + currency;

        // Get table
        const table = self.tables[tableName];

        // If table was not setup yet, set it up
        if (!table)
        {
            return setupTable(tableName).then(function ()
            {
                return downloadData(exchange, currency, startDate, endDate);
            });
        }

        // Instantiates a client
        const bigquery = BigQuery(
        {
            projectId: config.dbId
        });

        const select = 'SELECT * FROM ' + config.dbName + '.' + tableName;
        const where = 'WHERE TIMESTAMP > ' + startDate + ' AND TIMESTAMP < ' + endDate;

        const options = {
            query: select + ' ' + where,
            useLegacySql: false
        };

        return bigquery.query(options).then((results) =>
        {
            return results[0];
        }).catch(console.error);
    }

    /* Private methods */

    /**
     * Find or create dataset & table
     */
    function setupDB(options)
    {
        // While already setting up, wait 100ms and retry
        if (self.status === 'setting_up_db') return wait(setupDB, options);

        // If already setup, return
        if (self.status === 'ready') return Promise.resolve();

        self.status = 'setting_up_db';

        const bigquery = BigQuery(
        {
            projectId: options.dbId,
            credentials: JSON.parse(options.credentials)
        });

        return bigquery.getDatasets().then((results) =>
        {
            self.dataset = results[0].find((ds) => ds.id === options.dbName);
            if (self.dataset) return;

            return bigquery.createDataset(options.dbName).then((results) =>
            {
                self.dataset = results[0];
            });
        }).then(() =>
        {
            self.status = 'ready';
        }).catch((err) =>
        {
            console.error('ERROR:', err);
            self.status = 'error';
        });
    }

    function setupTable(tableName)
    {
        // While already setting up, wait 100ms and retry
        if (self.status === 'setting_up_table') return wait(setupTable, tableName);

        self.status = 'setting_up_table';

        const existingTable = self.tables[tableName];

        // If table already setup, return
        if (existingTable)
        {
            self.status = 'ready';
            return Promise.resolve();
        }

        // Otherwise, get tables from DB to see if it already exists
        return self.dataset.getTables().then((results) =>
        {
            const table = results[0].find((t) => t.id === tableName);
            if (table)
            {
                self.tables[tableName] = table;
                self.status = 'ready';
                return Promise.resolve();
            }

            return self.dataset.createTable(tableName,
            {
                schema: 'ID:integer,CURRENCY:string,TIMESTAMP:integer,PRICE:float,AMOUNT:float,TYPE:string'
            }).catch((err) =>
            {
                console.error('ERROR:', err);
                self.status = 'error';
            }).then((data) =>
            {
                self.tables[tableName] = data[0];
                self.status = 'ready';
            });
        });
    }

    function wait(callback, ...args)
    {
        return new Promise((resolve, reject) =>
        {
            setTimeout(() =>
            {
                // Have to flatten data due to dynamic args
                args = args.reduce(function (a, b)
                {
                    return a.concat(b);
                }, []);

                callback.apply(callback, Array.prototype.slice.call(args, 0)).then(resolve).catch(reject);;

                // callback(args).then(resolve).catch(reject);
            }, 100);
        });
    }
};