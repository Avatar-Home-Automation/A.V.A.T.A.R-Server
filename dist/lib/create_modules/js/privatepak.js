/**
 * tests the action
 * @private
 * @param {String} client - the A.V.A.T.A.R client which sent the sentence
 */
const test = (client) => {
    
	Avatar.speak(Locale.get(["message.test", client]), client);
  
}