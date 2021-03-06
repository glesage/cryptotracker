/* Dependencies */
const Storage = require('./lib/storage');
const Bitfinex = require('./lib/bitfinex');

const storage = new Storage(
{
	dbId: process.env.DB_ID,
	dbName: process.env.DB_NAME,
	credentials: process.env.DB_CREDS
});

Bitfinex(
{
	key: process.env.BIT_WS_KEY,
	secret: process.env.BIT_WS_SECRET,
	callback: storage.record,
	currencies: [
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
	]
});