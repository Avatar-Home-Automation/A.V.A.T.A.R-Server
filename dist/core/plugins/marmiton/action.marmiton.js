import {default as _helpers} from '../../ia/node_modules/ava-ia/helpers/index.js';

export default function (state) {
	
	return new Promise(async (resolve) => {
		// check the plugin rules table
		var match, rule, command, periph, answer, macro;
		var periphs = Config.modules.marmiton.intents;

		for (var i=0; i<periphs.length && !match; i++) {
			for (rule in Config.modules.marmiton[periphs[i]]) {
				if (rule !== 'command' && rule !== 'macro' && rule !== 'answer') {
					match = (0, _helpers.syntax)(state.sentence, Config.modules.marmiton[periphs[i]][rule]);
					if (match) {
						periph = periphs[i];
						command = (Config.modules.marmiton[periphs[i]].command) ? Config.modules.marmiton[periphs[i]].command : rule;
						answer = (Config.modules.marmiton[periphs[i]].answer) ? Config.modules.marmiton[periphs[i]].answer : null;
						macro = (Config.modules.marmiton[periphs[i]].macro) ? Config.modules.marmiton[periphs[i]].macro : false;
						break;
					}
				}
			}
		}

		setTimeout(() => { 
			state.action = {
				module: 'marmiton',
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



