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

const startDate = moment().startOf('month').format('x');
const endDate = moment().startOf('month').add(2, 'weeks').format('x');
const exchange = 'bitfinex';

const startDateDesc = '10012017';
const endDateDesc = '10142017';

currencies.forEach(function (currency)
{
	const fileName = './csv/bitfinex_' + currency + '_' + startDateDesc + '-' + endDateDesc + '.csv';
	const curr = currency.toLowerCase() + 'usd';

	fs.writeFile(fileName, 'Id,Currency,Timestamp,Price,Amount,Type', function (err)
	{
		storage.download(exchange, curr, startDate, endDate).then(function (data)
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
			});
		});
	});
});