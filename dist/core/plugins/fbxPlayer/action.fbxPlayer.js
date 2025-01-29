import {default as _helpers} from '../../ia/node_modules/ava-ia/helpers/index.js';

export default function (state) {
	
	return new Promise(async (resolve) => {
		// check the plugin rules table
		var match, rule, command, periph, answer, macro;
		var periphs = Config.modules.fbxPlayer.intents;

		for (var i=0; i<periphs.length && !match; i++) {
			for (rule in Config.modules.fbxPlayer[periphs[i]]) {
				if (rule !== 'command' && rule !== 'macro' && rule !== 'answer') {
					match = (0, _helpers.syntax)(state.sentence, Config.modules.fbxPlayer[periphs[i]][rule]);
					if (match) {
						periph = periphs[i];
						command = (Config.modules.fbxPlayer[periphs[i]].command) ? Config.modules.fbxPlayer[periphs[i]].command : rule;
						answer = (Config.modules.fbxPlayer[periphs[i]].answer) ? Config.modules.fbxPlayer[periphs[i]].answer : null;
						macro = (Config.modules.fbxPlayer[periphs[i]].macro) ? Config.modules.fbxPlayer[periphs[i]].macro : false;
						break;
					}
				}
			}
		}

		setTimeout(() => { 
			state.action = {
				module: 'fbxPlayer',
				command: command,
				periph: periph,
				value: rule,
				answer: answer,
				macro: macro
			};
			resolve(state);
		}, Config.waitAction.time);
	});
}



