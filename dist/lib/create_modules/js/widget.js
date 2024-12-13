import * as path from 'node:path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// exports.methods

/**
 * This function is the startup function of the plugin
 * by vocal rule: runs if an intention and an action are found or
 * directly by a request from other plugin, http request...
 * @param {object} data - the object sends from the action.js file of the plugin
 * @param {string=} data.client - the A.V.A.T.A.R client which sent the sentence
 * @param {string=} data.toClient - the A.V.A.T.A.R client where the rule is to be executed
 * @param {string=} data.rawSentence - the sentence not translated in english (speech language) 
 * @param {string=} data.sentence - the sentence translated in english 
 * @param {string=} data.language - the short code of the speech language (eg. 'en' or 'fr'...)
 * @param {string=} data.rule - the function defined in the intent file of the plugin
 * @param {Array=} data.tags - tags of the sentence translated in english
 * @param {Array=} data.tokens - tokens of the sentence translated in english
 * @param {object=} data.relations - relation found between object an action of the sentence translated in english
 * @param {object=} data.action - the function defined in the action file of the plugin
 * @param {function} callback - callback function if requested from other plugin
 * @return {function} callback - required - returns callback function
 */
export async function action(data, callback) {

	try {
		//getlangpak

		// Table of actions
		const tblActions = {
			// test (see rules table in the property file)
			test : () => test(data.client)					
		}
		
		// Writes info console
		info("test:", data.action.command, L.get("plugin.from"), data.client);
			
		// Calls the function that should be run
		tblActions[data.action.command]();
	} catch (err) {
		if (data.client) Avatar.Speech.end(data.client);
		if (err.message) error(err.message);
	}	
		
	// Returns callback
	callback();
 
}


//privateMethod
