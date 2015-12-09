'use strict';
var WebSocket = require('ws'),
    fs =    require('fs'),                     // Required to read certs and keys
    url = require('./globals.js');
var certFile = undefined;
var keyFile = undefined;
var checkInterval = 100;
var jsonCallbacks = [];
var messagesToSendQueue = [];
var ws ;
function connect(){
	var status = 0;

	var options = { 
	    key:   fs.readFileSync(keyFile),  // Secret client key
	    cert:  fs.readFileSync(certFile),  // Public client key
	    rejectUnauthorized: false              // Used for self signed server
	};

	ws = new WebSocket('wss://' + url.linkWithPort + '/pipes/ws/m',[],options);
	ws.on('open', function() {
		for(var m in messagesToSendQueue){
			ws.send(messagesToSendQueue[m]);
		}
		messagesToSendQueue.length = 0;
	});

	ws.on('message', function(message) {
		try{
			var jsonMessage = JSON.parse(message);
			for(var cb in jsonCallbacks){
				try{
					jsonCallbacks[cb](jsonMessage,ws);
				}catch(error){
					console.error(error);
				}
			}

		}catch(error){
		    console.log('received text: %s', message);
		}
	});
	ws.on('error',function(err){
		if(ws.readyState === ws.CONNECTING || ws.readyState === ws.CLOSED){
			checkInterval = checkInterval < 10000 ? parseInt(checkInterval * 1.5): parseInt(checkInterval * 1.05);  
			setTimeout(connect,checkInterval);
		}	
		console.log("reconnecting in " + checkInterval + " secs...");
	});

	return status;
}


module.exports = {
	registerOnJsonMessage: function(fn){ jsonCallbacks.push(fn);  },
	connect: function(cFile,kFile){certFile = cFile; keyFile=kFile; connect()},
	sendMessage: function(message){
		console.log("sending message ... ");
		console.log("readyState = " + ws.readyState);
		if(ws.readyState === ws.OPEN)
			ws.send(message);
		else
			messagesToSendQueue.push(message);
	},
	connectionStatus:function(){ console.log("Conenction state: " + ws.readyState);}
	
};
