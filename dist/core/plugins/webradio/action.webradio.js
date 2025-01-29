import {default as _helpers} from '../../ia/node_modules/ava-ia/helpers/index.js';

export default async function (state) {
	return new Promise(async (resolve) => {
		setTimeout(() => { 
			state.action = {
				module: 'webradio',
				command: state.rule
			};
			resolve(state);
		}, Config.waitAction.time);	
	});
}



