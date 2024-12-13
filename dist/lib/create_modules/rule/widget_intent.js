import {default as _helpers} from '../../ia/node_modules/ava-ia/helpers/index.js';

export default async function (state, actions) {
	// exits if the rule is already verified
	if (state.isIntent) return (0, _helpers.resolve)(state);

	// checks the plugin rules
	var match;
	var periphs = Config.modules.create_module.intents;

	for (var i=0; i<periphs.length && !match; i++) {
		for (var rule in Config.modules.create_module[periphs[i]]) {
			if (rule !== 'command' && rule !== 'macro' && rule !== 'answer') {
				match = (0, _helpers.syntax)(state.sentence, Config.modules.create_module[periphs[i]][rule]);
				if (match) break;
			}
		}
	}
	
	if (match) {
		state.isIntent = true;
		return (0, _helpers.factoryActions)(state, actions);
	} else 
		return (0, _helpers.resolve)(state);
}