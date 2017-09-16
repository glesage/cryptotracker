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
    if (!config.tableName) throw new Error('tableName is required for storage init');
    if (!config.credentials) throw new Error('credentials is required for storage init');

    var self = this;

    self.status = 'bare';
    self.record = recordData;

    setupDB(config);

    return self;

    /* Public methods */
    function recordData(data)
    {
        // While not ready, wait 100ms and retry
        if (self.status !== 'ready') return wait(recordData, data);

        // Make data into array for table insert
        if (!(data instanceof Array)) data = [data];

        return self.table.insert(data).catch((err) =>
        {
            if (err.name === 'PartialFailureError')
            {
                // err.errors (object[]):
                // err.errors[].row (original row object passed to `insert`)
                // err.errors[].errors[].reason
                // err.errors[].errors[].message
                err.errors.forEach((e) => console.log(e));
            }
            else console.log(err);
        });
    }

    /* Private methods */

    /**
     * Find or create dataset & table
     */
    function setupDB(options)
    {
        // While already setting up, wait 100ms and retry
        if (self.status === 'setting_up') return setupDB(recordData);

        // If already setup, return
        if (self.status === 'ready') return Promise.resolve();

        self.status = 'setting_up';

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
            return self.dataset.getTables();
        }).then((results) =>
        {
            self.table = results[0].find((t) => t.id === options.tableName);
            if (self.table) return;

            return self.dataset.createTable(options.tableName,
            {
                schema: 'ID:integer,TIMESTAMP:integer,PRICE:float,AMOUNT:float,TYPE:string'
            }).then((data) =>
            {
                self.table = data[0];
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

                callback(args).then(resolve).catch(reject);
            }, 100);
        });
    }
};