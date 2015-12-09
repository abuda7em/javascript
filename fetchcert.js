'use strict';
var https = require('https'),                  // Module for https
    fs =    require('fs'),                     // Required to read certs and keys
    url = require('./globals.js');
var options = { 
    rejectUnauthorized: false,              // Used for self signed server
    host: url.link,                    // Server hostname
    path: '/pipes/rest/initial',
    method:'POST',
    headers:{'Content-Type':'Application/Json'},
    port: url.port 
};
var certfile = undefined;
var keyfile = undefined;
var requestParams = {'numberOfPorts':8};
var callback = function(response,callback) {
	var str = '';    
	response.on('data', function (chunk) {
		str += chunk;
	}); 

	response.on('end', function () {
		var cert = JSON.parse(str);
		fs.writeFileSync(certfile,cert.certificate);
		fs.writeFileSync(keyfile,cert.key);
	});
	response.on('end',callback);
};

function fetch(cFile,kFile,callbackFn){
	certfile = cFile;
	keyfile = kFile;
	var req = https.request(options, function(response){ callback(response,callbackFn); });
	req.write(JSON.stringify(requestParams));
	req.end();

}
module.exports= { fetchCert:fetch };
