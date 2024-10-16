import {default as extend } from 'extend';  
import _ from 'underscore';
import * as path from 'node:path';
import { default as fs } from 'fs-extra';
import * as dgram from 'node:dgram';

var backupLast = [];

async function startUDPServer() {

	// creating a udp server
	const server = dgram.createSocket('udp4');

	// emits when any error occurs
	server.on('error',(err) => {
		error(L.get("script.udpError"), (err && err.length > 0) ? err : undefined)
	  	server.close();
	});

	// emits on new datagram msg
	server.on('message', (msg,infos) => {

		if (msg.toString().indexOf('AvatarClientPing') !== -1) {

			//receiving "Ping"
			var tblInfoClient = msg.toString().split(':')

			// Client Android
			if (tblInfoClient.length === 5 && tblInfoClient[1].toLowerCase() === 'mobile') {
				if (Avatar.exists('android')) {
					let folder = path.normalize(__dirname+'/../plugins/android/clients')
					let config = loadAndroidClients (folder, tblInfoClient[2])
					if (config.length == 0 &&  tblInfoClient[2].toLowerCase() != tblInfoClient[3].toLowerCase()) {
						config = loadAndroidClients (folder, tblInfoClient[3])
						tblInfoClient[2] = tblInfoClient[3]
					}

					if (config.length == 1) {
						var flagModif;

						// Client exists
						if (config[0].http.remote.ip != infos.address || config[0].http.remote.port != tblInfoClient[4] || config[0].client != tblInfoClient[3]) {
							// Config modified
							reWriteProp(folder, tblInfoClient[2], '"ip"', config[0].http.remote.ip, infos.address, false, function() {
								flagModif = (config[0].http.remote.ip != infos.address) ? ":true" : ":false"
								reWriteProp(folder, tblInfoClient[2], '"port"', config[0].http.remote.port, tblInfoClient[4], true, function() {
									flagModif = (config[0].http.remote.port != tblInfoClient[4]) ? flagModif+":true" : flagModif+":false"
									reWriteProp(folder, tblInfoClient[2], '"client"', config[0].client, tblInfoClient[3], false, function() {

										flagModif = (Config[0].client != tblInfoClient[3]) ? flagModif+":true" : flagModif+":false"

										let socketClient = Avatar.Socket.getClientSocket(tblInfoClient[2])
										if (socketClient)
											socketClient.emit('disconnect')
										else
											return error(tblInfoClient[2], L.get("script.noAndroidClient"))

										// New name for Android client
										if (config[0].client != tblInfoClient[3]) {
											info(L.get("script.newName"), tblInfoClient[2])
											let srcpath = path.normalize(__dirname+'/../plugins/android/clients/' + config[0].client)
											let dstpath = path.normalize(__dirname+'/../plugins/android/clients/' + tblInfoClient[3])

											fs.removeSync(dstpath)
											fs.move(srcpath, dstpath, (err) => {
														if (err) return error(L.get("script.renameError"), tblInfoClient[2], L.get("script.to"), tblInfoClient[3], ":", err)

														//receiving "Ping", sending "Pong"
														sendConfirmation(server, "AvatarServerPong"+flagModif, infos.address, infos.port, () => {
															info(L.get("script.accessGranded"))
														});

														// Reload plugin
														warn(L.get("script.reloadModule"));
											});

										} else {

											sendConfirmation(server, "AvatarServerPong"+flagModif, infos.address, infos.port, () => {
												info(L.get("script.accessGranded"))
											});

											// Reload plugin
											warn(L.get("script.reloadModule"));
										}
									});
								});
							});
						} else {
							// no modification
							//receiving "Ping", sending "Pong"
							sendConfirmation(server, "AvatarServerPong:false:false:false", infos.address, infos.port, () => {
								info(L.get("script.welcomeClient"), tblInfoClient[2], "!")
							});
						}
					} else {
						sendConfirmation(server, "AvatarServerPong:noClient", infos.address, infos.port, () => {
							// Error in the Android plugin
							error(L.get("script.no"), tblInfoClient[2], L.get("script.foundWithError"))
						})
					}
				} else {
					sendConfirmation(server, "AvatarServerPong:noPlugin", infos.address, infos.port, () => {
						// No Android plugin
						warn(L.get("script.noAndroidPlugin"))
					})
				}
			} else if (tblInfoClient.length === 3 && tblInfoClient[1].toLowerCase() === 'fixe') {
				sendConfirmation(server, "AvatarServerPong", infos.address, infos.port);
			}
		}
	});

	//emits when socket is ready and listening for datagram msgs
	server.on('listening',() => {
		var addr = server.address();
		appInfo(L.get("script.udp"), addr.port, "(", addr.family, ")")
	});

	//emits after the socket is closed using socket.close();
	server.on('close',() => {
		info(L.get("script.udpClosed"))
	});

	server.bind(Config.udp.port);
}


function sendConfirmation  (server, msg, address, port, callback) {

	msg = Buffer.from(msg);
	server.send(msg, port, address, (err) => {
		if(err)
			error(L.get("script.udpSendingError"), (err.length > 0) ? err : undefined)
		else
			if (callback) callback();
	});
}


function reWriteProp (folder, client, key, oldKey, value, noCote, callback) {

	if (oldKey != key) return callback()

	let file = path.normalize(folder + '/' + client + '/client.ini')
	let prop  = fs.readFileSync(file,'utf8')
	let beginProp = prop.substring(0,prop.indexOf(key) + (key).length)
	let toReplace = prop.substring(prop.indexOf(key) + (key).length)
	toReplace = toReplace.substring(0,toReplace.indexOf(',') + (',').length)

	if (!noCote) {
		toReplace = toReplace.substring(0,toReplace.indexOf('"') + ('"').length)
		toReplace = toReplace + value + '",'
	} else {
		let beginReplace = toReplace.substring(0,toReplace.indexOf(':') + (':').length)
		let endReplace = toReplace.substring(toReplace.indexOf('}'))
		toReplace = beginReplace + "	" + value + "\n		" + endReplace
	}
	let endProp = prop.substring(prop.indexOf(key) + (key).length)
	endProp = endProp.substring(endProp.indexOf(',') + (',').length)
	let newProp = beginProp + toReplace + endProp

	fs.writeFileSync(file, newProp, 'utf8')
	callback();
}



function loadAndroidClients (folder, client, json) {
  var json   = json   || [];
  var folder = folder || CLIENTS;

  if (!fs.existsSync(folder)) { return json; }

	fs.readdirSync(folder).forEach((file) => {
    var pathFile = folder+'/'+file
    // Not client directory
    if (!fs.statSync(pathFile).isDirectory()) {
      loadAndroidClients(pathFile, client, json)
      return json
    }

		// client directory
		if (fs.statSync(pathFile).isDirectory() && file == client){
			fs.readdirSync(pathFile).forEach((file) => {
				// client properties
				if (file.endsWith('.ini')) {
				  try {
						var load   =  fs.readFileSync(pathFile+'/'+file,'utf8');
						var properties = JSON.parse(load)
						if (properties.client.length == 0)
							error(L.get("script.errorProperty"))
						else
							json.push(properties)
				  } catch(ex) { error(L.get("script.errorInFile"), file, ":", ex.message) }
		 		}
			})
		}
  })

  return json

}



function routes (req, res) {

	var cmd   = req.params.plugin;
	var data  = req.query;
	if (req.body) data.body = req.body;

	if (data.waitResponse) data.res = (res) ? res : null;

	if (data.command) {
		let tmpOptions = {action : {}};
		extend(true, tmpOptions.action, data);
		data = tmpOptions;	
	}

	run(cmd, data);
	if (res && !data.waitResponse) res.status(200).end();
}


function last (client) {

	if (!client) return;

	return _.filter(backupLast, cl => {
		return cl.client.toLowerCase() === client.toLowerCase();
	});
}


const setBackupLastAction = (...args) => {

	let plugin, options, callback;
	for (let n of args) {
		if (typeof n === 'function') callback = n;
		if (typeof n === 'object') options = n;
		if (typeof n === 'string') plugin = n;
	}

	let client;
	if (options) client = options.client || options.action?.client || null;

	if (client) {
		for (let i in backupLast) {
			if (backupLast[i].client.toLowerCase() === client.toLowerCase()) {
				backupLast[i].plugin = plugin;
				backupLast[i].options = options;
				backupLast[i].callback = callback ? callback : false;
				return;
			}
		}

		backupLast.push({
			client: client,
			plugin: plugin,
			options: options,
			callback: callback ? callback : false
		})
	}
}



function run (name, ...args) {

	if (!name) {
		return error(L.get("script.runError"));
	}

	let options, callback;
	for (let n of args) {
		if (typeof n === 'function') callback = n;
		if (typeof n === 'object') options = n;
	}
  	
	// Call script
	call(name, options, callback);
}


async function call (name, ...args) {

	if (!name) {
		return error(L.get("script.runError"));
	}

	// Find Plugin
	const plugin = Avatar.find(name);
	if (!plugin){
		error(L.get("script.callStart"), name, L.get("script.callEnd"));
		if (callback) callback();
		return;
	}

	let options, callback;
	for (let n of args) {
		if (typeof n === 'function') callback = n;
		if (typeof n === 'object') options = n;
	}
	if (!options) options = {};

	// backup last action
	setBackupLastAction (name, options, callback);
	
	// Set callback
	const next = data => {
		if (data && data.error) {
			error(L.get("script.callStart")+name+"')", data.error);
		}
		if (callback) callback(data);
	}

	// Run script
	try {
		const script = await plugin.getInstance();
		script.action(options, next);
	}
	catch(ex){
		error(L.get("script.callStart")+name+"')", ex.message);
		next();
	}
}


async function initScript () {
	Avatar.run = run;
	Avatar.call = call;
	Avatar.last = last;
	Avatar.Script = {
		'run' : run,
		'call' : call,
		'last' : last,
		'routes' : routes,
		'UDP' : startUDPServer
	}
}

export { initScript };

