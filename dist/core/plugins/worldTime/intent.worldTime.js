import {default as _helpers} from '../../ia/node_modules/ava-ia/helpers/index.js';

export default async function (state, actions) {

	// exits if the rule is already verified
	if (state.isIntent) return (0, _helpers.resolve)(state);
	
	// checks the plugin rules
	for (var rule in Config.modules.worldTime.rules) {	 
		var match = (0, _helpers.syntax)(state.sentence, Config.modules.worldTime.rules[rule]); 	
		if (match) break;
	}
	
	if (match) {
		state.isIntent = true;
		state.rule = rule;
		return (0, _helpers.factoryActions)(state, actions);
	} else 
		return (0, _helpers.resolve)(state);
}