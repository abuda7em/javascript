var certFile = "client/cert.crt"
	, keyFile="client/key.key"
	, fs =    require('fs'),
	version = 0,
	gpios = [4,4,17,27,22,18,23,24,25];

try{
	fs.readFileSync(certFile);
	fs.readFileSync(keyFile);
        for(var g in gpios){
            var exec = require('child_process').exec;
            exec('/usr/local/bin/gpio -g mode ' + gpios[g]  + ' OUT',function(error,out){
                
            });
        }
	certificateReady();
}catch(error){
	console.log("cert not found, fetching .... ");
	var certImporter = require('./fetchcert.js');
	certImporter.fetchCert(certFile,keyFile,certificateReady);
}

function certificateReady(){
	console.log("Certificate ready ... ");
	var socket = require('./socket.js');
	try{
		var status = socket.connect(certFile,keyFile);
		console.log(status);
		socket.registerOnJsonMessage(onJsonMessage);
	}catch(error){
		console.log(error);
	}
	setTimeout(function(){console.log("Console after timeout");},5000);
}

function onCronsListRecieved(crons, version){
	require('crontab').load(function(err,crontab){
            if(err){
                console.error(err);
                return ;
            }
		var jobs = crontab.jobs();
		for(var j in jobs){
			crontab.remove(jobs[j]);
		}
		crontab.save();
                
		crontab.create('/usr/local/bin/node /root/runner.js','@reboot');

		for(var c in crons){
			var cron = crons[c];

			var startTime = new Date(0,0,0,cron.hours,cron.minutes);
			var endTime = new Date(startTime.getTime() + (60000 * parseInt(cron.duration)));

			var job = crontab.create('/usr/local/bin/gpio -g write ' + gpios[cron.number] + ' 0');
			var endJob = crontab.create('/usr/local/bin/gpio -g write ' + gpios[cron.number] + ' 1'); 

			job.minute().at(cron.minutes);
			job.hour().at(cron.hours);

			endJob.minute().at(endTime.getMinutes());
			endJob.hour().at(endTime.getHours());

			for(var day in cron.days){
				job.dow().on(cron.days[day]);
				if(startTime.getDay() !== endTime.getDay())
					endJob.dow().on( ((cron.days[day] + 1)%7) ); // overnight 
				else
					endJob.dow().on(cron.days[day]);
			}
			job.comment(cron.id);
			endJob.comment(cron.id);
			console.log(job.toString());
			console.log(endJob.toString());
		}
		crontab.save();
	},null,true);
}

function requestCronsList(ws){
	ws.send(JSON.stringify({"command":"update_crons"}));
}

function requestVersion(ws){
	ws.send(JSON.stringify({"command":"version"}));
}
function onShellStart(){
	var shellSocket = require('./remoteshell.js');	
	try{
                var status = shellSocket.connect(certFile,keyFile);
        }catch(error){
                console.log(error);
        }
}

function onJsonMessage(obj,ws){
	console.log("recieved msg: " + obj);
	if(obj.command && obj.command !== "shell")
		console.log("received command: " + obj.command);
	else if (obj.version && !obj.crons){
		if(obj.version !== version){
			console.log("Version is outdated");
			requestCronsList(ws);
		}
	}else if(obj.crons !== undefined && obj.version !== undefined){
		console.log("recieved cron list");
		onCronsListRecieved(obj.crons,obj.version);
	}else if(obj.command && obj.command === "shell"){
		onShellStart();
	}else{
		console.error("recieved unknown json");
		console.error(obj);
	}
}
