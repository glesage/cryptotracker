function fixedDecimals(number, decimals)
{
	const multiplier = Math.pow(10, decimals);
	const rounded = (Math.floor(multiplier * parseFloat(number)) / multiplier);

	return rounded.toFixed(decimals);
}

function btfnxPrice(price)
{
	const priceFixed = parseFloat(price);
	return fixedDecimals(priceFixed, 4);
}

module.exports.btfnxPrice = btfnxPrice;