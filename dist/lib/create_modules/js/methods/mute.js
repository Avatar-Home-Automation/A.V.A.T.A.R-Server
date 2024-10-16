/**
 * This function is called if the client passing the rule is in loop mode just after the trigger keyword or
 * in question/answer mode.
 * Lets you perform an action such as mute a device (TV or other) during a dialog.
 * @param {string} clientFrom - the A.V.A.T.A.R client which sent the rule
 * @param {string} clientTo - the A.V.A.T.A.R client who must execute the rule, can be virtual or real (same as clientFrom)
 * @example
 * rule from living room ==> switch of the light in the bedroom
 * Prerequisites: the bedroom must be a virtual client of living room
 * result: 
 * clientFrom = living room 
 * clientTo = bedroom
 */
 export async function mute(clientFrom, clientTo) {

  // Add function executed to mute a device
  
}