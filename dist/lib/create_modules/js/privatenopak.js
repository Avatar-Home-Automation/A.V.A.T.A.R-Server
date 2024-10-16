/**
 * tests the action
 * @private
 * @param {String} client - the A.V.A.T.A.R client which sent the sentence
 */
const test = (client) => {

	const lang = {
		fr: `J'exécute l'action pour la pièce ${client}`,
		en: `I run the action for ${client}`
	};

	const tts = lang[Config.language] ? lang[Config.language] : lang['en'];
	Avatar.speak(tts, client);
  
}
