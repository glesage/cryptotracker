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

		const lineReader = rl.createInterface(
		{
			input: fs.createReadStream(csvDir + filename)
		});

		let lines = [];

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
			const volume = sum(lines, 'amount');
			const open = lines[0].price;
			const close = lines[lines.length - 1].price;
			const high = max(lines, 'price');
			const low = min(lines, 'price');
			const weighted = sum(lines, 'priceTimesAmount') / volume;

			console.log();
			console.log(currency);
			console.log('Trades: ' + lines.length);
			console.log('Volume: ' + volume + ' ' + currency);
			console.log('Open: ' + open);
			console.log('Close: ' + close);
			console.log('High: ' + high);
			console.log('Low: ' + low);
			console.log('Weighted average: ' + weighted);
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