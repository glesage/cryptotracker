/* Dependencies */
const Storage = require('./lib/storage');
const moment = require('moment-timezone');
const fs = require('fs');

const storage = new Storage(
{
	dbId: process.env.DB_ID,
	dbName: process.env.DB_NAME,
	credentials: process.env.DB_CREDS
});

const currencies = [
	'BTC',
	'ETH',
	'LTC',

	'OMG',
	'BCH',
	'ETC',
	'XMR',
	'EOS',
	'NEO',
	'ZEC',
	'XRP',
	'SAN'
];

var dates = [
{
	startDate: moment('03/01/2018', 'MM/DD/YYYY').startOf('day').format('x'),
	endDate: moment('03/31/2018', 'MM/DD/YYYY').endOf('day').format('x'),
	startDateDesc: '03012018',
	endDateDesc: '03312018'
}];

function downloadForCurrency(currency, date)
{
	console.log(currency);
	console.log(date);

	return new Promise(function (resolve, reject)
	{
		const fileName = './csv/bitfinex_' + currency + '_' + date.startDateDesc + '-' + date.endDateDesc + '.csv';
		const curr = currency.toLowerCase() + 'usd';

		fs.writeFile(fileName, 'Id,Currency,Timestamp,Price,Amount,Type', function (err)
		{
			storage.download('bitfinex', curr, date.startDate, date.endDate).then(function (data)
			{
				writeToFile(fileName, data).then(resolve).catch(reject);
			});
		});
	});
}

function writeToFile(fileName, data)
{
	return data.reduce(function (prev, curr)
	{
		return prev.then(function ()
		{
			return new Promise(function (resolve, reject)
			{
				var dataString = '\n' + curr.ID;
				dataString += ',' + curr.CURRENCY;
				dataString += ',' + curr.TIMESTAMP;
				dataString += ',' + curr.PRICE;
				dataString += ',' + curr.AMOUNT;
				dataString += ',' + curr.TYPE;

				fs.appendFile(fileName, dataString, function (err)
				{
					if (err) console.log(err);
					resolve();
				});
			});
		});
	}, Promise.resolve());
}

currencies.reduce(function (prev, currency)
{
	return prev.then(function ()
	{
		return dates.reduce(function (subPrev, date)
		{
			return subPrev.then(function ()
			{
				return downloadForCurrency(currency, date);
			});
		}, Promise.resolve());
	});
}, Promise.resolve());