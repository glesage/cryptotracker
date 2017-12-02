const fs = require('fs');
const rl = require('readline');

const csvDir = 'csv/';

fs.readdir(csvDir, function (err, filenames)
{
	if (err)
	{
		console.error('Could not read directory');
		console.error(err);
		return;
	}

	filenames.forEach(function (filename, idx)
	{
		if (filename === '.DS_Store' || filename === 'Store') return;

		const fileDsc = filename.split('-')[0];
		const exchange = fileDsc.split('_')[0];
		const currency = fileDsc.split('_')[1];

		let lines = [];

		let open = 0;
		let close = 0;
		let low = 0;
		let high = 0;
		let weighted = 0;

		const lineReader = rl.createInterface(
		{
			input: fs.createReadStream(csvDir + filename)
		});

		lineReader.on('line', function (line)
		{
			const values = line.split(',');
			if (values[0] === 'Id') return;

			const price = parseFloat(values[3]);
			const amount = parseFloat(values[4]);
			lines.push(
			{
				price: price,
				amount: amount,
				priceTimesAmount: price * amount
			});
		});

		lineReader.on('close', function (line)
		{
			console.log();
			console.log(currency);
			console.log('Trades: ' + lines.length);
			console.log('Volume: ' + sum(lines, 'amount').toFixed(0) + ' ' + currency);
			console.log('Open: ' + lines[0].price);
			console.log('Close: ' + lines[lines.length - 1].price);
			console.log('High: ' + max(lines, 'price'));
			console.log('Low: ' + min(lines, 'price'));
			console.log('Weighted average: ' + sum(lines, 'priceTimesAmount') / lines.length);
		});

		function sum(arr, property)
		{
			return arr.reduce(function (a, b)
			{
				return a + parseFloat(b[property]);
			}, 0);
		}

		function max(arr, property)
		{
			let len = arr.length;
			let maxVal = 0;
			while (len--)
			{
				if (arr[len][property] > maxVal) maxVal = arr[len][property];
			}
			return maxVal;
		}

		function min(arr, property)
		{
			let len = arr.length;
			let minVal = arr[0][property];
			while (len--)
			{
				if (arr[len][property] < minVal) minVal = arr[len][property];
			}
			return minVal;
		}
	});
});