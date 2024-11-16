/**
 * This function is called if the client passing the rule is in loop mode or 
 * question/answer mode just after the end of the dialog.
 * Allows you to perform an action, such as putting back the sound of a device (TV or other) after the dialogue.
 * @param {string} clientFrom - the real A.V.A.T.A.R client which sent the rule
 * @param {string} clientTo - the A.V.A.T.A.R client who must execute the rule, can be virtual or real (same as clientFrom)
 * @example
 * rule from living room ==> "switch of the light in the bedroom"
 * Prerequisites: the bedromm must be a virtual client of living room
 * result: 
 * clientFrom = living room 
 * clientTo = bedroom
 */
export async function unmute (clientFrom, clientTo) {

  // Add function executed to unmute a device
  
}

