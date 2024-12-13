import { default as klawSync } from 'klaw-sync';
import {default as express } from 'express';
import * as http from 'node:http';
import _ from 'underscore';
import fs from 'fs-extra';
import { CronJob } from 'cron';
import * as os from 'node:os';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import { initScript } from "./core/manager/script.js";
import { initConfig } from "./core/manager/config.js";
import { initPlugin } from "./core/manager/plugin.js";
import { initSocket } from "./core/manager/socket.js";
import { initCron } from "./core/manager/cron.js";
import { initIa } from "./core/manager/ia.js";
import { initSpeech } from "./core/manager/speech.js";
import { initStatic } from "./core/manager/staticFolder.js";
import { initPluginLanguage } from "./core/manager/language.js";
import * as pluginLib from './pluginLibrairy.js';
import * as functionsLib from './functionLibrairy.js';
import * as widgetlib from './widgetLibrairy.js';
import * as githubLib from './githubRepos.js';

var app = express();
let options = [];
let safeStorage;


function encrypt (value) {
    if (safeStorage.isEncryptionAvailable() && typeof value === "string") {
        let encrypted = safeStorage.encryptString(value);
        encrypted = encrypted.toJSON();
        return encrypted.data;
    } else {
		return false;
	}
}


function decrypt (value) {
    if (safeStorage.isEncryptionAvailable() && (typeof value === "string" || typeof value === "object")) {
		if (typeof value === "string") value = value.split(',');
        const encrypted = Buffer.from(value);
        let decrypted = safeStorage.decryptString(encrypted);
        return decrypted;
    } else {
		return false;
	}
}


async function getIpAddress() {
	let ip = '127.0.0.1';
	const ips = os.networkInterfaces();
	Object
	.keys(ips)
	.forEach(function(_interface) {
		ips[_interface]
		.forEach(function(_dev) {
			if (_dev.family === 'IPv4' && !_dev.internal) ip = _dev.address 
		}) 
	});

	return ip;
}


function init (preferredLanguage, encrypt) {

	return new Promise(async (resolve) => {
  
		global.Avatar = Avatar;
		safeStorage = encrypt;
		
		let server = http.createServer(app);
		global.app = app;

		Avatar.APIFunctions = await functionsLib.init();
		Avatar.Widget = await widgetlib.init();
		Avatar.pluginLibrairy = await pluginLib.init();
		Avatar.github = await githubLib.init();
		Avatar.Interface = {};
		Avatar.Nodes = {};

		// plugins folder must exists
		fs.ensureDirSync(path.resolve(__dirname, 'core', 'plugins')); 

		// Load modules
		await initPluginLanguage();
		await initStatic();
		await initSocket();
		await initScript();
		await initConfig();
		await initPlugin();
		await initCron();
		await initIa();
		await initSpeech();
		
		// Update Config.language for the current instance only with the current language because it can be 'auto'
		Config.language = preferredLanguage;
	
		app.get ('/avatar/:plugin', Avatar.Script.routes); // HTTP routes
		app.post('/avatar/:plugin', Avatar.Script.routes); // HTTP routes
	
		Avatar.Socket.load(server); // Load sockets
		Avatar.Cron.start(); // Start Cron
	
		var webapp = server.listen(Config.http.port);  // Start HTTP server
		await Avatar.Script.UDP(); // Start UDP server

		Config.http.ip = await getIpAddress();

		appInfo(L.get("script.http"), webapp.address().port); // logger

		resolve();
	})

}


function remote(query, client, callback) {
	if (!query) {
		throw new Error (L.get("avatar.noquery"));
	}
	if (!client) client = Config.default.client ? Config.default.client : null;
	if (!client) {
		throw new Error (L.get("avatar.noClientSpeak"));
	}
	let clientSocket = Avatar.Socket.getClientSocket(client);
	if (!clientSocket) {
		throw new Error (L.get("avatar.noclient"));
	}
	
	clientSocket.emit(query.cmd, query, callback);
}


function getOptions(client) {
	if (options.length === 0) return;
	return _.find(options, (num) => {
		return num.id === client;
	})
}


function removeOptions(client) {
	options = _.filter(options, (num) => {
		return num.id !== client;
	})
}


function askme(tts, client, grammar, timeout, callback, ...args) {
	if (!grammar) { 
		throw new Error ("Askme: "+L.get("avatar.nogrammar"));
	};
	if (!callback){ 
		throw new Error ("Askme: "+L.get("avatar.nocallback"));
	};
	if (!client) client = Config.default.client;

	client = getTrueClient(client);

	let client_options = getOptions(client);
	if (!client_options) {
		options.push({'id': client, 'tooltipClient': client, 'grammar':[], 'tags':[]})
		client_options = getOptions(client);
	}

	let clientSocket = Avatar.Socket.getClientSocket(client);
	if (!clientSocket) { 
		throw new Error ("Askme: "+L.get(["avatar.nosocket", client]));
	}
	for (var g in grammar){
	  client_options.grammar.push(g);
	  client_options.tags.push(grammar[g]);
	}

	if (tts) {
		if (typeof tts === 'object') tts = randomeTTS(tts);
		if (tts.indexOf('|') !== -1) tts = tts.split('|')[Math.floor(Math.random() * tts.split('|').length)];
		client_options.tts = tts;
		Avatar.Interface.tooltipSpeak({client: client, tts: tts, type: 'target'});
	}

	for (let n of args) {
		if (typeof n === 'string') client_options.rawSentence = n;
		if (typeof n === 'object') {
			if (n.voice) client_options.voice = n.voice;
			if (n.volume) client_options.volume = n.volume;
			if (n.speed) client_options.speed = n.speed;
			if (n.pitch) client_options.pitch = n.pitch;
		}
	}
  
	client_options.timeout = timeout && timeout > 0 && timeout < 20 ? timeout * 1000 : 20000;
	clientSocket.askme = {callback: callback, end: end};

	clientSocket.emit('askme',getOptions(client));
	token (client, callback);

  }
  


function token(client, callback) {

	var client_options = getOptions(client);
	if (!client_options) return;

	var socketClient = Avatar.Socket.getClientSocket(client);
	if (client_options.token)  {
		appInfo(L.get("avatar.clearToken"), client);
		clearTimeout(client_options.token);
	}
  
	client_options.token = setTimeout(() => {
		removeOptions(client);
		socketClient.emit('askme_stop');
		callback(false, end);
	}, client_options.timeout);
}


function end(client, done) {
	client = getTrueClient(client);
	if (done) {
		let socketClient = Avatar.Socket.getClientSocket(client);
		if (!socketClient) return error('Askme End:', L.get("avatar.nosocket"), client);
		if (socketClient.askme) socketClient.askme = null;
		socketClient.emit('askme_done');
	}
  
	let client_options = getOptions(client);
	if (client_options && client_options.token) clearTimeout(client_options.token);
	removeOptions(client);
}


function randomeTTS(elem) {
	let tab = Object.values(elem);
	let randomIndex = Math.floor(Math.random() * tab.length);
	return tab.splice(randomIndex, 1)[0];
}  


function speak(tts, client, ...args) {

	let end = true, callback, voice, volume, speed, pitch;
	let count = 0
	for (let n of args) {
		if (count < 2) {
			if (typeof n === 'function') callback = n;
			if (typeof n === 'boolean') end = n;
		}
		if (count >= 2 && typeof n === 'object') {
			if (typeof n === 'object') {
				if (n.voice) voice = n.voice;
				if (n.volume) volume = n.volume;
				if (n.speed) speed = n.speed;
				if (n.pitch) pitch = n.pitch;
			}
		}
		count += 1;
	}

	if (!client) client = Config.default.client ? Config.default.client : null;
	if (!client) {
		throw new Error (L.get("avatar.noClientSpeak"));
	}
	if (!tts) {
		throw new Error (L.get("avatar.notts"));
	} 

	if (typeof tts === 'object') tts = randomeTTS(tts);
	if (tts.indexOf('|') !== -1) 
		tts = tts.split('|')[Math.floor(Math.random() * tts.split('|').length)];
	
	Avatar.Interface.tooltipSpeak({client: client, tts: tts, type: 'target'});
	
	var qs = {
		'cmd': 'speak',
		'tts': tts,
		'end': end,
		'voice': voice ? voice : null,
		'volume': volume ? volume : null,
		'speed': speed ? speed : null,
		'pitch': pitch ? pitch : null,
		'sync': callback ? true : false
	}

	let trueClient = getTrueClient(client);
	return remote(qs, trueClient, callback);
}


function clientFromRule (sentence) {

	const clients = Avatar.Socket.getClients();

	let isClient =  _.find(clients, num => {
		return sentence.toLowerCase().indexOf(num.name.toLowerCase()) !== -1;
	});

	if (!isClient) {
		isClient =  _.find(Config.virtual, num => {
			return sentence.toLowerCase().indexOf(num.split(',')[0].toLowerCase()) !== -1;
		})
		if (isClient) isClient = isClient.split(',')[0];
	} else {
		isClient = isClient.name;
	}

	return isClient;
}

  
function isVirtualClient(client) {
	let mapped = _.find(Config.virtual, (num) => {
		return client.toLowerCase() === num.split(',')[0].toLowerCase();
	});

	return mapped ? true : false;
}


function getVirtualClients(client) {
	let virtualClients = [];
	let even = _.filter(Config.virtual, (num) => {
	  return num.split(',')[1].toLowerCase() == client.toLowerCase();
	});
  
	if (even) {
	  _.map(even, (num) => {
		virtualClients.push(num.split(',')[0]);
	  })
	}
  
	return virtualClients;
}


function isMobile(client) {
	if (!client) return false;
	if (Avatar.Socket) {
		let clients = Avatar.Socket.getClients();
		var even = _.find(clients, num => {
			return (num.id.toLowerCase() === client.toLowerCase() && num.is_mobile);
		})
	}
	return even ? true : false;
}


function stop(client, callback) {

	if (!client) client = Config.default.client ? Config.default.client : null;
	if (!client) {
		throw new Error (L.get("avatar.noClientStop"));
	}

	const qs = {
		'cmd': 'stop',
		'sync': callback ? true : false
	}

	const trueClient = getTrueClient(client);
	return remote(qs, trueClient, callback);
}


function play() {
	let callback, end;
	var playfile = typeof arguments[0] === 'string' ? arguments[0] : null;
	var client = typeof arguments[1] === 'string' ? arguments[1] : null;
	var type = typeof arguments[2] === 'string' && arguments[2] !== 'before' && arguments[2] !== 'after' ? arguments[2]: 'after';
	if (arguments[3] !== undefined) {
		if (typeof arguments[3] === 'function') callback = arguments[3];
		if (typeof arguments[3] === 'boolean' || (typeof arguments[3] === 'string' && arguments[3] === 'before' || arguments[3] === 'after')) end = arguments[3];
	}
	if (arguments[4] !== undefined) {
		if (typeof arguments[4] === 'function') callback = arguments[4];
		if (typeof arguments[4] === 'boolean' || (typeof arguments[4] === 'string' && arguments[4] === 'before' || arguments[4] === 'after')) end = arguments[4];
	}

	if (!client) client = Config.default.client ? Config.default.client : null;
	if (!client) {
		throw new Error (L.get("avatar.noClientPlay"));
	}
	if (!playfile) {
		throw new Error (L.get("avatar.noPlayFile"));
	} 

	if (end === undefined) end = true;

	const qs = {
		'cmd': 'play',
		'play': playfile,
		'end': end,
		'type': type,
		'sync': callback ? true : false
	}

	const trueClient = getTrueClient(client);
	return remote(qs, trueClient, callback);
}



function getTrueClient(client) {
	if (!client) return;
	let even = _.find(Config.virtual, (num) => {
		  return num.split(',')[0].toLowerCase() === client.toLowerCase();
	});
	return (even) ? even.split(',')[1] : client;
}


function getProperty(file, property) {

	if (fs.existsSync(file)) {
		const properties = fs.readJsonSync(file, { throws: false });
		if (property && Object.prototype.hasOwnProperty.call(properties, property)) {
				return property[property];
		} else {
			return properties;
		}
	} else {
		return {};
	}
	
}


function clientPlugin(client, plugin, ...args) {
	if (!client || typeof client !== 'string') {
		throw new Error (L.get("avatar.noClientclientPlugin"));
	}

	if (!plugin || typeof client !== 'string') {
		throw new Error (L.get("avatar.noParamclientPlugin"));
	}

	let param, callback;
	for (let n of args) {
		if (typeof n === 'function') callback = n;
		if (typeof n === 'object') param = n;
	}

	const qs = {'cmd': 'plugin',
			  'plugin': plugin,
			  'param': param || {},
			  'sync' : callback ? true : false
	};
  
	const trueClient = getTrueClient(client);
	return remote(qs, trueClient, callback);
}


function runApp(appExe, client, ...args) {

	if (!client) client = Config.default.client ? Config.default.client : null;
	if (!client || typeof client !== 'string') {
		throw new Error (L.get("avatar.noClientRunApp"));
	}
	if (!appExe || typeof client !== 'string') {
		throw new Error (L.get("avatar.noExeRunApp"));
	} 

	let param, callback;
	for (let n of args) {
		if (typeof n === 'function') callback = n;
		if (typeof n === 'string') param = n;
	}

	const qs = {'cmd': 'run',
			  'run': appExe,
			  'param': param,
			  'sync' : callback ? true : false
	};
  
	const trueClient = getTrueClient(client);
	return remote(qs, trueClient, callback);
}



async function tranfertPlugin (plugin, client, ...args) {
	if (!plugin || typeof plugin !== 'string') {
		throw new Error (L.get("avatar.noPluginCopyPlugin"));
	} 
	if (!client) client = Config.default.client ? Config.default.client : null;
	if (!client || typeof client !== 'string') {
		throw new Error (L.get("avatar.noClientCopyPlugin"));
	}

	let callback, backup;
	for (let n of args) {
		if (typeof n === 'function') callback = n;
		if (typeof n === 'boolean') backup = n;
	}

	const trueClient = getTrueClient(client);

	if (backup === true) {
		const qs = {
			'cmd': 'backupPlugin',
			'plugin': plugin,
			'sync' : callback ? true : false
		};

		return remote(qs, trueClient, () => { 
			startTranfertPlugin (plugin, trueClient, callback);
		});
	} else {
		startTranfertPlugin (plugin, trueClient, callback);
	}
}


async function startTranfertPlugin (plugin, client, callback) {
	let src = path.resolve(__dirname, 'core', 'plugins', plugin);
	let folders = klawSync(src, {nodir: true});
	if (folders.length > 0) {
		let folderPath = destinationFile(plugin, folders[0].path);
		let dest = folders[0].path.replace(path.dirname(folders[0].path), 'PLUGIN:'+folderPath);
		
		copyFile(folders[0].path, dest, client, () => tranfertPluginNext(client, plugin, folders, 1, () => {
			if (callback) return callback();
		}));
	} else {
		if (callback) return callback();
	}
}


function tranfertPluginNext (client, plugin, folders, count, callback) {
	if (count >= folders.length) {
		if (callback) return callback();
	}

	let folderPath = destinationFile(plugin, folders[count].path);
	let dest = folders[count].path.replace(path.dirname(folders[count].path), 'PLUGIN:'+folderPath);
	copyFile(folders[count].path, dest, client, () => {
		tranfertPluginNext(client, plugin, folders, ++count, callback);
	});
}


const destinationFile = (plugin, filePath) => {
	let basenameDir = path.basename(path.dirname(filePath));
	let countPath = filePath.indexOf(plugin+path.sep);
	let lastCountPath = filePath.lastIndexOf(plugin+path.sep);

	return (basenameDir !== plugin || countPath !== lastCountPath) 
	? path.dirname(filePath.substring(countPath))
	: plugin;
}


function copyFile(src, dest, client, ...args) {

	if (!src || typeof src !== 'string') {
		throw new Error (L.get("avatar.noSrcCopyFile"));
	} 
	if (!dest || typeof dest !== 'string') {
		throw new Error (L.get("avatar.noDestCopyFile"));
	} 

	if (!client) client = Config.default.client ? Config.default.client : null;
	if (!client || typeof client !== 'string') {
		throw new Error (L.get("avatar.noClientCopyFile"));
	}

	let callback, end, backup;
	for (let n of args) {
		if (typeof n === 'function') callback = n;
		if (typeof n === 'string') end = n;
		if (typeof n === 'boolean') backup = n;
	}

	const qs = {'cmd': 'copyFile',
			  'src': src,
			  'dest': dest,
			  'end': end,
			  'backup': backup,
			  'sync' : callback ? true : false
	};
  
	const trueClient = getTrueClient(client);
	return remote(qs, trueClient, callback);

}


async function updateVersion(version) {

	const exitApp = () => {
		warn(L.get(['newVersion.step1', version]));
		const d = new Date();
		const s = d.getSeconds()+5;
		d.setSeconds(s);
		new CronJob(d, async () => {
			Avatar.Interface.mainWindow().destroy();
		}, null, true);
	}

	let cmd, batch;
	let installPath = path.resolve(__dirname, 'tmp');
    switch (process.platform) {
	case 'win32':

		const powerShell = (Config.powerShell) ? Config.powerShell : "powershell";

		cmd = "@echo off";
		cmd += "\n";
		cmd += `call cmd /K "${powerShell}" -ExecutionPolicy Bypass -command ./${version}.ps1`;
		
		fs.copySync(path.resolve(__dirname, 'lib', 'versioning', 'win32', 'step-1.ps1'), path.resolve(`${installPath}`, `${version}.ps1`));
		fs.writeFileSync(path.resolve(`${installPath}`, 'shell.bat'), cmd, 'utf8');

		const opened = await Avatar.Interface.shell().openPath(path.resolve(`${installPath}`, "shell.bat"));
		if (opened) {
			Avatar.Interface.dialog().showErrorBox('Error:', L.get(['newVersion.errorOpenTerminal', version, opened]));
		} else {
			exitApp();
		}
		break;
	case 'linux':
		cmd = `cd ${installPath}\n`;
		cmd += `export NVM_DIR="$HOME/.nvm"\n`;
		cmd += `[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"\n`;
		cmd += `[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"\n`;
		cmd += `pwsh -ExecutionPolicy Bypass -command ./${version}.ps1`;
				
        fs.copySync(path.resolve(__dirname, 'lib', 'versioning', 'linux', 'step-1.ps1'), path.resolve(`${installPath}`, `${version}.ps1`));
		fs.writeFileSync(path.resolve(`${installPath}`, 'shell.sh'), cmd, 'utf8');
        fs.chmodSync(path.resolve(`${installPath}`, 'shell.sh'), "755");
        batch = `gnome-terminal --working-directory=${installPath} -- ./shell.sh`;

        exec(batch, err => {
            if (err) {
              return Avatar.Interface.dialog().showErrorBox('Error:', L.get(['newVersion.errorOpenTerminal', version, err]));
            }
            exitApp();
        });
		break;
	case 'darwin':
		cmd = `osascript -e 'tell application "Terminal" to do script "cd ${installPath} && pwsh -command ./${version}.ps1" & activate'`;
		
        fs.copySync(path.resolve(__dirname, 'lib', 'versioning', 'darwin', 'step-1.ps1'), path.resolve(`${installPath}`, `${version}.ps1`));
		
		batch = `${installPath}/shell.sh`
		fs.writeFileSync(batch, cmd, 'utf8');
        fs.chmodSync(batch, "755");

        exec(batch, err => {
            if (err) {
              return Avatar.Interface.dialog().showErrorBox('Error:', L.get(['newVersion.errorOpenTerminal', version, err]));
            }
			exitApp();
        });
		break;	
	}
}


var Avatar = {
	'init': init,
	'remote': remote,
	'speak': speak,
	'askme': askme,
	'getProperty': getProperty,
	'getVirtualClients': getVirtualClients,
	'isVirtualClient': isVirtualClient,
	'getTrueClient': getTrueClient,
	'getAskmeOptions': getOptions,
	'token': token,
	'isMobile': isMobile,
	'clientFromRule': clientFromRule,
	'encrypt': encrypt,
	'decrypt': decrypt,
	'play': play,
	'stop': stop,
	'runApp': runApp,
	'clientPlugin': clientPlugin,
	'copyFile': copyFile,
	'tranfertPlugin': tranfertPlugin,
	'updateVersion': updateVersion
}

export { init };
  