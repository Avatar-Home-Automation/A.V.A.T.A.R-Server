import * as path from 'node:path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// exports.methods

/**
 * This function is the startup function of the plugin
 * by vocal rule: runs if an action is directly set by a request from other plugin, http request...
 * @param {object} data - the object sends from the action.js file of the plugin
 * @param {string=} data.client - the A.V.A.T.A.R client which sent the sentence
 * @param {string=} data.toClient - the A.V.A.T.A.R client where the rule is to be executed
 * @param {object=} data.action - the function defined in the action file of the plugin
 * @param {function} callback - callback function if requested from other plugin
 * @return {function} callback - required - returns callback function
 */
export async function action(data, callback) {

	try {
		//getlangpak
		
		// Writes info console
		info("create_module");
	} catch (err) {
		if (data.client) Avatar.Speech.end(data.client);
		if (err.message) error(err.message);
	}	

	// Returns callback
	callback();
 
}

