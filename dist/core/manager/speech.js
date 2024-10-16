async function mute(client) {
	if (!client) client = Config.default.client
	let pluginList = await Avatar.Plugin.getList()
	for (let i=0; i < pluginList.length; i++) {
		if (pluginList[i]._script.mute) {
			pluginList[i]._script.mute(Avatar.getTrueClient(client), client)
		}
	}
}


async function unmute(client) {
	if (!client) client = Config.default.client
	let pluginList = await Avatar.Plugin.getList();
	for (let i=0; i < pluginList.length; i++) {
		if (pluginList[i]._script.unmute) {
			pluginList[i]._script.unmute(Avatar.getTrueClient(client), client)
		}
	}
}


async function unmuteClosure (client) {
	if (!client) client = Config.default.client;
	let pluginList = await Avatar.Plugin.getList();
	for (let i=0; i < pluginList.length; i++) {
		if (pluginList[i]._script.unmuteClosure) {
			pluginList[i]._script.unmuteClosure(client);
			break;
		}
	}
}


async function end(client, ...args) {
	
	var full, callback;
	for (let n in args) {
		if (typeof n === 'boolean') full = n;
		if (typeof n === 'function') callback = n;
	}

	if (!client) client = Config.default.client;
	const socketClient = Avatar.Socket.getClientSocket(Avatar.getTrueClient(client));
	if (socketClient) {
		socketClient.emit('end', client, (full ? full : true));
	} else
		error(L.get("speech.noClient"));

	if (callback) {
		let found;
		let pluginList = await Avatar.Plugin.getList();
		for (let i=0; i < pluginList.length; i++) {
			if (pluginList[i]._script.timeoutCallbackEnd) {
				setTimeout(() => {
					if (callback) callback();
				}, pluginList[i]._script.timeoutCallbackEnd(client))
				found = true;
				break;
			}
		}
		if (!found) callback();
	}
}


async function initSpeech () {
	Avatar.Speech = {
		'mute': mute,
		'unmute': unmute,
		'unmuteClosure': unmuteClosure,
		'end' : end
	}
} 

export { initSpeech };
