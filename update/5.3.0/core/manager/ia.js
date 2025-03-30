import _ from 'underscore';
import * as ia from '../ia/index.js';
import { scenarionByRule } from '../../scenarioLibrary.js';

function action (sentence, client, language, callback) {

	client = Avatar.getTrueClient(client);
	const toClient = Avatar.Socket.currentClient(client, sentence);

	info(L.get("ia.sentenceFrom"), client, ":", sentence);
	if (client !== 'TranslateByInterface') {
		Avatar.Interface.tooltipSpeak({client: client, tts: sentence, type: 'source'});
	}
	
	ia.listen(sentence, client, language.split('-')[0], (state) => {
		if (!state) {
			Avatar.Speech.end(client);
			return error(L.get("ia.noAction"));
		}

		state.toClient = toClient;
		state.client = client;

		// Removes some stuffs...
		state = _.omit(state, 'intents');
		state = _.omit(state, 'isIntent');
		state = _.omit(state, 'debug');
		state = _.omit(state, 'reformat');

		if (state.action) {

			state.action.end = state.action.end === undefined ? true : state.action.end;
			let clientSocket = Avatar.Socket.getClientSocket(client);
			
			// module + tts
			if (state.action.module && state.action.tts) {
				return	Avatar.speak(state.action.tts, client, state.action.end, Avatar.run(state.action.module, state, callback))
			}

			// module only
			if (state.action.module) {
				return Avatar.run(state.action.module, state, (state.action.callback ? state.action.callback : callback));
			}

			// tts only
			if (state.action.tts) {
				return Avatar.speak(state.action.tts, client, state.action.end);
			}

			// scenarios
			if (state.action.scenario) {
				info(L.get(["scenario.exec", state.action.flow]));
				scenarionByRule(state.action.flow, state.action.id, state, callback);
			}

			// nothing...
			if (state.action.norule) {
				Avatar.speak(state.action.value, client, false, () => clientSocket.emit('listen_again'));
			}
		}
	}, (err) => {
		if (client) Avatar.Speech.end(client, true);
		if (err) error('Ia module Error:', err.message || err.stack || 'unknow');
	})
}


function addPlugin(plugin) {
	ia.addPlugin(plugin);
}


async function initIa () {
	ia.intent();
	Avatar.Ia = {
		'action': action,
		'addPlugin': addPlugin
	}
}

export { initIa };

