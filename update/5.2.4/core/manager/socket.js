import _ from 'underscore';
import moment from 'moment';
import { CronJob } from 'cron';
import { Server } from 'socket.io';
import { default as ss } from '../../lib/socket.io-stream/index.js';
import fs from 'fs-extra';
import * as path from 'node:path';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let cron;
let countInstall;

class Client {
  constructor(name, obj, loop_mode, server_speak, ip, port, mobile, language, platform) {
    this.id = name.reformat();
    this.name = name;
    this.Obj = obj;
    this.loop_mode = loop_mode || false;
    this.server_speak = server_speak;
    this.ip = ip;
    this.loopback = port;
    this.language = language;
    this.is_mobile = mobile || false;
    this.platform = platform || 'Unknow'
    Clients.add = this;
  }
}


const Clients = {
  list: [],
  disconnected: [],
  get all() {return this.list;},
  get size() {return this.list.length;},
  set add(obj) {this.list.push (obj);},
  get disconnectedSize() {return this.disconnected.length},
  set addDisconnected(name) {
    this.list = _.filter(this.list, element => {
      if (element.name === name) {
        this.disconnected.push({id: name, time: moment().format("YYYY-MM-DDTHH:mm")});
        Avatar.Interface.removeClientNode(name);
        if (Avatar.Socket.ioEmitter && Avatar.Socket.ioEmitter[name]) {
          Avatar.Socket.ioEmitter[name] = null;
        }
      }
      return element.name !== name;
    })
  },
  set removeDisconnected(name) {
    this.disconnected = _.filter(this.disconnected, element => {
  		return element.name !== name;
  	});
  },
  getById: id => {
    return _.find(Clients.all, element => {
        return element.id === id;
    });
  },
  getByName: name => {
    return _.find(Clients.all, element => {
        return element.name === name;
    });
  },
  getLanguageByName: name => {
    return _.find(Clients.all, element => {
        return element.name === name;
    });
  },
  getByObjId: objId => {
    return _.find(Clients.all, element => {
        return element.Obj.id === objId;
    });
  },
  currentClient: (sentence, id) => {
    let client = Clients.getByObjId(id);
    if (!sentence) return client.name;
    let isClient = Avatar.clientFromRule(sentence);
    return isClient ? isClient : client.name;
  }
}



function setSockets (http) {

  let dataCallback;

	const io = new Server(http);
	io.on('connection', obj => {

    // client connection
		obj.on('client_connect',  (name, ip, port, server_speak, loop_mode, mobile, language, platform) => {

      // Check if client is connected
      if (Clients.getByName(name))
        return error(L.get(["socket.alreadyConnected", name]));

      // Check if a client has a same name of a client already connected
      if (Clients.getByObjId(obj.id))
        return error(L.get(["socket.sameName", Clients.getByName(name).name, name]));

      // Add client to the list of connected clients
      let client = new Client (name, obj, loop_mode, server_speak, ip, port, mobile, language, platform);

      // Add client node to Avatar
      client.addNode();

      // Remove client from the disconnected list
			Clients.removeDisconnected = name;

			// Send confirmation to client
			obj.emit('connected');
      infoGreen(L.get(["socket.client", name]));
		})

    // client disconnected
		.on('disconnect', () => {
        let client = Clients.getByObjId(obj.id);
        if (client) {
          Clients.addDisconnected = client.name;
          warn(L.get(["socket.gone", client.name]));
        }
		})

    // Rule sent by client
		.on('action', sentence => {
       Avatar.Ia.action(sentence, Clients.getByObjId(obj.id).name, Clients.getByObjId(obj.id).language);
    })

    // direct plugin action
    .on('plugin_action', (cmd, action) => {
      if (Avatar.exists(cmd)) {
        if (!action.client) {
          action.client =  Clients.getByObjId(obj.id).name;
        }
        action.language = Clients.getByObjId(obj.id).language.split('-')[0].toLowerCase();
        Avatar.call(cmd, action);
      } else {
        error(L.get(["plugin.notExist", cmd]));
        Avatar.Speech.end(Clients.getByObjId(obj.id).name, true);
      }
		})

    // Reset timeout askme
		.on('reset_token', () => {
			if (obj.askme && obj.askme.callback)
				Avatar.token(obj.client, obj.askme.callback);
			else
				error(L.get("socket.askmeCallback"));
		})

    // answer askme
		.on('answer', answer => {
			if (obj.askme && obj.askme.callback) {
        let tts = (answer.indexOf(':') !== -1) ? answer.split(':')[1] : answer;
        let client_options = Avatar.getAskmeOptions(Clients.getByObjId(obj.id).name);
        let ttsClient = client_options ? client_options.tooltipClient : Clients.getByObjId(obj.id).name;
        Avatar.Interface.tooltipSpeak({client: ttsClient, tts: tts, type: 'source'});
        obj.askme.callback(answer, obj.askme.end);
		  }	else
				error(L.get("socket.askmeCallback"));
		})

    // if speaks is managed from the server, not from the client
		.on('server_speak', (tts, callback, end, rawSentence, plugin, options) => {
      
      const name = Clients.getByObjId(obj.id).name;

      if (plugin) {
        let script = Avatar.find(plugin);
        if (!script || !script._script.subclassSpeak) {
          error(L.get(["socket.noSubclassSpeak", plugin]));
          if (callback === true) obj.emit('callback_client_speak');
          return;
        }
      }

      let clientSpeak;
      if (Avatar.Socket.isMobile(name) && Avatar.Socket.isServerSpeak(name)) {
        clientSpeak = Avatar.Socket.currentClient(rawSentence, obj.id);
      } else {
        clientSpeak = name;
      }

      if (rawSentence) end = false;

			Avatar.speak(tts, clientSpeak, end, () => {
				if (callback === true) obj.emit('callback_client_speak');
			}, options)
		})

    // mute after hotword or askme
		.on('mute', (client) => {
			Avatar.Speech.mute(client);
		})

    // unmute after speech or askme end
    .on('unmute', client => {
			Avatar.Speech.unmute(client);
		})

    // special transportClosure after speech or askme end for subclass speak
    .on('unmuteClosure', client => {
			Avatar.Speech.unmuteClosure(client);
		})

    // data for the callback emmited by the client
    .on('callback-data', (data) => {
       dataCallback = data || null;
		})

    // callback function emmited by the client
		.on('callback', (callback) => {
			if (callback) {
        callback(dataCallback);
        dataCallback = null;
      }
		})

    // Install new version on clients
    .on('sendNewClientVersion', (client, version) => {
        if (client) {
          obj.emit('updateLocalVersion', version);
        } else {
          countInstall = 0;
          copyFile(obj, null, version, () => {
            const NewClientFile = path.resolve (__dirname, '..', '..', 'tmp', 'download', 'clientVersion-'+version+'.zip');
            _.map(Clients.all, element => {
              if (!element.is_mobile) {
                element.Obj.emit('updateVersionFromServer', NewClientFile, version);
              } else {
                countInstall += 1;
              }
            })
          })
        }
    })

    // Remove new client update version only if all clients are updated
    .on('installClientVersionDone', client => {
      if (countInstall) {
        countInstall += 1;
        if (countInstall === Clients.size) {
          fs.removeSync(path.resolve(__dirname, '..', '..', 'tmp', 'download'));
        }
      } 
      infoGreen(L.get(["avatar.updateClientVersion", client]));
    })

    .on('sendIntercom', async (sentence, duration, full) => {
      
      let client = Avatar.clientFromRule(sentence);
      let from =  Clients.getByObjId(obj.id).name;
     
      let intercomTo = _.filter(Clients.all, elem => {
        if (full) {
          if (!Clients.getByObjId(obj.id).is_mobile) return elem;
        } else {
          let trueClient = (client) ? Avatar.getTrueClient(client) : Clients.getByObjId(obj.id).name;
          return trueClient === elem.name;
        }
      });

      if (intercomTo.length > 0 || client) {

        if (!Clients.getByObjId(obj.id).loopback) {
          warn (L.get(["socket.noClientRoute", client]));
          return;
        }

        let adress = Clients.getByObjId(obj.id).ip+':'+Clients.getByObjId(obj.id).loopback;
        let alreadyPlayedTo = [];

        _.map(intercomTo, async element => {
          if (element.server_speak === false && element.is_mobile === false) {
            element.Obj.emit('playIntercom', from, adress);
            info (L.get(["socket.intercomSent", from, element.name]));
            alreadyPlayedTo.push(element.name);
          }
        })

        if (!full && alreadyPlayedTo.length === 1) return;
 
        let found = false;
        let pluginList = await Avatar.Plugin.getList();
        for (let i in pluginList) {
          if (pluginList[i]._script.subclassIntercom) {
            copyFile(obj, pluginList[i].name, null, () => {
                pluginList[i]._script.subclassIntercom(from, (full === true ? 'all' : client), duration, alreadyPlayedTo);
              });
              found = true;
              break;
          }
        }
        if (!found) warn(L.get("socket.noSubclassPlay"));

      } else {
        warn (L.get("socket.noClientIntercomSend"));  
        Avatar.speak(L.get("socket.noClientIntercom"), Clients.getByObjId(obj.id).name);
      }
    })

    ss(obj).on('copyFile', (file, stream) => {
			fs.createReadStream(file).pipe(stream);
		});

  })

}


function copyFile(element, plugin, version, callback) {

  const sharedFolder = version ? path.resolve(__dirname, '..', '..', 'tmp', 'download') : path.resolve(Config.modules[plugin].speech.sharedFolder, 'intercom');
  fs.ensureDirSync(sharedFolder);

  const file = version ? path.resolve (sharedFolder, 'clientVersion-'+version+'.zip') : path.resolve (sharedFolder, 'intercom.wav');

  const stream = ss.createStream();
	stream.pipe(fs.createWriteStream(file));
  const event = version ? 'copyNewVersion' : 'copyIntercomFile';
  ss(element).emit(event, stream, callback);

}


Client.prototype.addNode = function () {
  Avatar.Interface.addClientNode({id: this.id, name: this.name, type: this.is_mobile ? "mobile" : "classic"});
}


String.prototype.reformat = function (){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
        / /g, /'/g,
        /"/g
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c','_','',''];
    var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }
    return str;
}


// Send notification if the client is deconnected
function sendnotif (client) {
	//Only if, in avatar.prop file, Config.default.reboot_time not exists
	//OR Config.default.reboot_time exists & current hour is not the same <> 20mn
	//eg. reboot_time : "03:30"
  // 2 modules are defined for free and pushover, use them to create another sending message woth other providers
  // more information in the documentation
	if (!isreboot(client)) {
		var notify = require('../notify/' + Config.notification.sendType)()
		notify.send(L.get("socket.notify"), L.get("socket.client"), client,  L.get("socket.gone"))
	}
}


function isreboot (client) {
	if (!Config.default.reboot_time || Config.default.reboot_time === '') return false;

	var hour = moment().format("YYYY-MM-DDT") + Config.default.reboot_time
	var maxhour = moment(hour).add(20, 'minutes').format("YYYY-MM-DDTHH:mm")
	var minhour = moment(hour).subtract(20, 'minutes').format("YYYY-MM-DDTHH:mm")

	if ((moment().isBefore(maxhour) === true && moment().isAfter(minhour) === true) || moment().isSame(hour)=== true ) {
		info(L.get(["socket.noNotif", client]));
		return true;
	}
	return false;
}



function disconnected_cron() {
	if (cron) cron.stop()
	var d = new Date()
	var s = d.getMinutes()+Config.notification.reconnectIn
	d.setMinutes(s)

	var minhour = moment().subtract(Config.notification.reconnectIn, 'minutes').format("YYYY-MM-DDTHH:mm")
	cron = new CronJob(d, function(done) {
		if (Clients.disconnectedSize > 0) {
			var disconnected_list = _.filter(Clients.disconnected, num => {
				return moment(num.time).isBefore(minhour) == true || moment(minhour).isSame(num.time) == true;
			})

			if (disconnected_list) {
				_.map(disconnected_list, client => {
					if (Config.notification.sendNotif) sendnotif(client.name)
          Clients.removeDisconnected = client.name
				})
			}
		}
		disconnected_cron()
	}, null, true)
}


async function initSocket() {

  Avatar.Socket = {
    'load': http => {
      setSockets(http);
      // Temporary commented
      // disconnected_cron();
    },
    'getClients': () => {return (Clients.size > 0) ? Clients.all : null},
    'getClientName': id => { return Clients.getByObjId(id) ? Clients.getByObjId(id).name : null},
    'getClient': name => { 
        name = Avatar.getTrueClient(name);
        return Clients.getByName(name) ? Clients.getByName(name) : null;
    },
    'getClientId': id => { return Clients.getByObjId(id) ? Clients.getByObjId(id).id : null},
    'isServerSpeak': name => {
      if (Clients.size === 0) return;
      name = Avatar.getTrueClient(name);
      return (Clients.getByName(name)) ? Clients.getByName(name).server_speak : false;
    },
    'setServerSpeak': (name, value) => {
      if (Clients.size === 0) return;
      name = Avatar.getTrueClient(name);
      if (Clients.getByName(name)) Clients.getByName(name).server_speak = value;
    },
    'getClientSocket': name => {
      if (Clients.size === 0) return;
      name = Avatar.getTrueClient(name);
      return (Clients.getByName(name)) ? Clients.getByName(name).Obj : null;
    },
    'isLoopMode': name => {
      if (Clients.size === 0) return;
      name = Avatar.getTrueClient(name);
      return (Clients.getByName(name)) ? Clients.getByName(name).loop_mode : false;
    },
    'getPlatform': name => {
      if (Clients.size === 0) return;
      return (Clients.getByName(name)) ? Clients.getByName(name).platform : false;
    },
    'isMobile': name => {
      if (Clients.size === 0) return;
      return (Clients.getByName(name)) ? Clients.getByName(name).is_mobile : false;
    },
    'getLoopback': name => {
      if (Clients.size === 0) return;
      return (Clients.getByName(name)) ? Clients.getByName(name).loopback : null;
    },
    'currentClient': (name, sentence) => {
      return Clients.currentClient(sentence, Clients.getByName(name).Obj.id);
    },
    'getClientIoEmitter': name => {
      return Avatar.Socket.ioEmitter[name] ? Avatar.Socket.ioEmitter[name] : null;
    }
  }

}

export { initSocket };
