/**
The create_module API provides the mandatory functions for the creation of widgets and access to your home automation system. 
You can update these functions to access your home automation and return to A.V.A.TA.R the mandatory information 
but you must imperatively keep the functions present in this module.
Consult the documentation for further information
**/

import axios from 'axios';

let Config;

/**
 * Get basic caracteristics from a user peripheral
 * Used by the Widget Studio 
 @param { String }  the object id
 @return { object } caracteristics from a user peripheral 
**/
async function getPeriphCaract (id) {

	try {
		/*
		let url = 'http://.....';
		
		const response = await axios ({
			url: url,
			method: 'get',
			responseEncoding: 'binary',
			responseType: 'json'
		});

		if (response.status !== 200 || response.data.success === "0") {
			throw new Error (`Impossible de récupérer les caractéristiques du périphérique ${id}`)
		}

		return response.data.body;
		*/
		
		return {}; // FOR THE CREATION OF THE MODULE !!! Remove this line !!

	} catch (err) {
		error ('getPeriphCaract create_module function: '+err);
	} 

}


/**
 * Get the list of values of a user peripheral
 * Used by the Widget Studio 
 @param { String }  the object id
 @return { object } the values of the user peripheral
**/
async function getPeriphValues (id) {
	try {
		/*
		let url = 'http://...';

		const response = await axios ({
			url: url,
			method: 'get',
			responseEncoding: 'binary',
			responseType: 'json'
		});

		if (response.status !== 200 || response.data.success === "0") {
			throw new Error (`Impossible de récupérer les informations du périphérique ${id}`)
		}

		return response.data.body;*/
		
		return {}; // FOR THE CREATION OF THE MODULE !!! Remove this line !!
		
	} catch (err) {
		error ('getPeriphValues create_module function: '+err);
	} 
}


/**
 * Set a value for a user peripheral. 
 * Used by a click on the widget image 
 @param { String }  the object id
 @param { String }  the value to set
 @return { none }
**/
async function set (id, value) {
	try {
		/*
		let url = 'http://.....';

		const response = await axios ({
			url: url,
			method: 'get',
			responseType: 'json'
		});

		if (response.status !== 200 || response.data.success === "0") {
			throw new Error (`Impossible d'exécuter l'action pour le périphérique ${id}`)
		}
		*/

		return;
	} catch (err) {
		error ('set create_module function: '+err);
	} 
}


/**
 * Activate a macro on a user peripheral. 
 * Used by a click on the widget image 
 @param { String }  the macro id
 @return { none }
*/
async function macro (macro_id) {
	try {
		/*
		let url = 'http://....';
		
		const response = await axios ({
			url: url,
			method: 'get',
			responseType: 'json'
		});

		if (response.status !== 200 || response.data.success === "0") {
			throw new Error (`Impossible d'exécuter la macro ${macro_id}`)
		} */

		return;
	} catch (err) {
		error ('macro create_module function: '+err);
	} 
}


/**
 * Get periph list attached to your user account
 @param { String } the value to set
 @return { Objet } a list of periphs
**/
async function getPeriphInfos () {
	try {
		/*
		let url = 'http://.....';
		const response = await axios ({
			url: url,
			method: 'get',
			responseEncoding: 'binary',
			responseType: 'json'
		});

		if (response.status !== 200 || response.data.success === "0") {
			throw new Error ('Impossible de récupérer les informations des périphériques')
		}

		return response.data.body;*/
		
		return {}; // FOR THE CREATION OF THE MODULE !!! Remove this line !!
	} catch (err) {
		error ('getPeriphInfos create_module function: '+err);
	} 
}

/**
 * Initialisation of the module
 @param { Conf } The properties of the module
 @return { none } 
*/
var initVar = function (conf) {
	Config = conf.API
}


async function init () {
	return {
		'initVar': initVar,
		'set': set,
		'macro': macro,
		'getPeriphCaract': getPeriphCaract,
		'getPeriphValues': getPeriphValues,
		'getPeriphInfos': getPeriphInfos
	}
}


export { init };
