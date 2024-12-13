/**
 * Uncomment, remove imports, methods, and other relationships below if you want to use it or not.
 */

//import * as create_moduleLib from './lib/create_module.js';
//const create_moduleAPI = await create_moduleLib.init();

import * as widgetLib from '../../../widgetLibrairy.js';
const Widget = await widgetLib.init();

// devices table
let periphInfo = [];
//varlangpak

const widgetFolder = path.resolve(__dirname, 'assets/widget');
const widgetImgFolder = path.resolve(__dirname, 'assets/images/widget');

/**
 * Saves widget positions when A.V.A.T.A.R closes (json files saved in ./asset/widget folder)
 @param {object} widgets - widgets of the plugin
 */
export async function onClose (widgets) {
	
	// Save widget positions
	if (Config.modules.create_module.widget.display === true) {
		await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.create_module);
		if (widgets) await Widget.saveWidgets(widgets);
	}

	// Do other stuff
}


/**
 * Executed at the loading of the plugin
 */
export async function init () {

//langpak

}


/**
 * Searchs for existing Widgets when initializing A.V.A.T.A.R
 * Executed upon loading the plugin
 @return {object} object - the list of existing widgets (json files) saved in ./asset/widget folder
 */
export async function getWidgetsOnLoad () {
	if (Config.modules.create_module.widget.display === true) {
		await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.create_module);
		let widgets = await Widget.getWidgets();
		return {plugin: "create_module", widgets: widgets, Config: Config.modules.create_module};
	} 
}


/**
 * Executed after all widgets are loaded in the A.V.A.T.A.R interface
 * for example, used to refresh information of a widget
 @return {none}
 */
export async function readyToShow () {
	// Do stuff
}


/**
 * Requested only if a widget type is 'button' 
 * returns the new button image state to display 
 * 
 @param {object} arg - button parameters
 @return {string} 
 */
export async function getNewButtonState (arg) {
	return;
}


/**
 * Mandatory do not remove !
 * Returns existing widgets
 @return {object} 
 */
export async function getPeriphInfo () {
	return periphInfo;
}


/**
 * Action performed by clicking on a widget image
 @param {object} even - button parameters
 */
export async function widgetAction (even) {
	
	if (even.type !== 'button') {
		
		// Action for 'List of values' and 'float value' types
		await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.create_module);
		return await Widget.widgetAction(even, periphInfo);
	
	} else {
	    // Action for 'button' type 
		
		// Do stuff
		infoConsole(even.value);
	}
}

