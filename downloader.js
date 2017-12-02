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
	startDate: moment('11/01/2017', 'MM/DD/YYYY').startOf('day').format('x'),
	endDate: moment('11/30/2017', 'MM/DD/YYYY').endOf('day').format('x'),
	startDateDesc: '11012017',
	endDateDesc: '11302017'
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
				let dataString = '';
				data.forEach(function (d)
				{
					dataString += '\n' + d.ID;
					dataString += ',' + d.CURRENCY;
					dataString += ',' + d.TIMESTAMP;
					dataString += ',' + d.PRICE;
					dataString += ',' + d.AMOUNT;
					dataString += ',' + d.TYPE;
				});

				fs.appendFile(fileName, dataString, function (err)
				{
					if (err) console.log(err);
					resolve();
				});
			});
		});
	});
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