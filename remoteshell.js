'use strict';
var WebSocket = require('ws'),
    fs =    require('fs'),                     // Required to read certs and keys
    exec = require('child_process').exec,
    url = require('./globals.js');
var certFile = undefined;
var keyFile = undefined;
var checkInterval = 100;
var jsonCallbacks = [];
var messagesToSendQueue = [];
var shellsocket , cwd = "/root";
function connect(){
	var status = 0;

	var options = { 
	    key:   fs.readFileSync(keyFile),  // Secret client key
	    cert:  fs.readFileSync(certFile),  // Public client key
	    rejectUnauthorized: false              // Used for self signed server
	};

	shellsocket = new WebSocket('wss://' + url.linkWithPort + '/pipes/ws/shell',[],options);
	shellsocket.on('open', function() {
	});

	shellsocket.on('message', function(message) {
		try{
			var jsonCommand = JSON.parse(message);
			console.log("recieved cmd: " + jsonCommand.command);
			if (jsonCommand.command.startsWith("cd")){
				exec(jsonCommand.command + "; pwd",function(err,wd){
					cwd = wd;
					console.log("changed working directory to: " + cwd);
				});
			}
			var options = {cwd:cwd};
			exec(jsonCommand.command,options,function(err,output){
				var res = {};
				res.type = err ? "error":"output";
				res.text = err? err : output;
				shellsocket.send(JSON.stringify(res));
			});

		}catch(error){
		    console.log('received text: %s', message);
		}
	});
	shellsocket.on('error',function(err){
	});

	return status;
}


module.exports = {
	connect: function(cFile,kFile){certFile = cFile; keyFile=kFile; connect()},
};
