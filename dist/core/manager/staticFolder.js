import {default as express } from 'express';
import _ from 'underscore';

let folders = [];

function setStaticFolder(folder, callback) {

	if (!_.contains(folders, folder)) {

		// Static folder for Mobile
		const tblclients = Avatar.Socket.getClients();
		if (tblclients) {
			tblclients.forEach(element => {
				if (element.is_mobile && element.platform === 'Chrome') {
					element.Obj.emit('setStaticFolder', folder);
				}
			});
		}
		
		app.use(express.static(folder));
		folders.push(folder);
  	}
  	if (callback) callback();

}


function setToClient (folder, client, callback) {

	if (!client || typeof client !== 'string') {
		error(L.get("avatar.noClientStaticFolder"));
		if (callback) callback();
		return;
	}
	if (!folder || typeof client !== 'string') {
		error(L.get("avatar.noFolderStaticFolder"));
		if (callback) callback();
		return;
	} 

	var qs = {'cmd': 'setStaticFolder',
			  'folder': folder,
			  'sync' : callback ? true : false
	};
  
	let trueClient = Avatar.getTrueClient(client);
	return Avatar.remote(qs, trueClient, callback);


}


async function initStatic() {
  Avatar.static = {
    'set' : setStaticFolder,
    'setToClient': setToClient
  }
}

export { initStatic }
