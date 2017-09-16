/* Dependencies */
const BitfinexWS = require('bitfinex-api-node');
const btfnxPrice = require('./utilities').btfnxPrice;

function bitfinex(config)
{
    if (!config.key) throw new Error('key is required for bitfinex init');
    if (!config.secret) throw new Error('secret is required for bitfinex init');

    let self = this;

    self.callback = config.callback || function () {};

    const bws = new BitfinexWS(config.key, config.secret).ws;

    bws.on('open', () =>
    {
        bws.subscribeTrades('BTCUSD');
    });

    bws.on('trade', onTrade);
    bws.on('error', console.error);

    return self;

    function onTrade(pair, data)
    {
        if (!validateData(data)) return;

        const rawAmount = parseFloat(data.amount);
        const trade = {
            id: data.id,
            timestamp: parseInt(data.timestamp) * 1000,
            type: rawAmount > 0 ? 'buy' : 'sell',
            amount: rawAmount > 0 ? rawAmount : -rawAmount,
            price: btfnxPrice(data.price)
        };
        if (!validateTrade(trade)) return;

        if (self.callback) self.callback(trade);
    }

    function validateData(data)
    {
        if (!data) return false;
        if (!data.id) return false;
        if (!data.timestamp) return false;
        if (!data.amount) return false;
        if (!data.price) return false;

        if (!Number.isFinite(parseFloat(data.amount))) return false;
        if (!Number.isFinite(parseFloat(data.price))) return false;

        return true;
    }

    function validateTrade(data)
    {
        if (!data) return false;
        if (!data.id) return false;
        if (!data.timestamp) return false;
        if (!data.amount) return false;
        if (!data.price) return false;
        if (!data.type) return false;

        if (!Number.isFinite(parseFloat(data.amount))) return false;
        if (!Number.isFinite(parseFloat(data.price))) return false;

        return true;
    }
}

module.exports = bitfinex;