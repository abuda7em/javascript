var forever = require('forever-monitor');

var child = new (forever.Monitor)('main.js', {
	max : 1000,
	silent : false
});
child.on('exit', function () {
	console.log('runner exited on: ' + new Date());
});

console.log('runner started on: ' + new Date());
child.start();
